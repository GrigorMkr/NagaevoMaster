#!/usr/bin/env bash
# Личный WireGuard на VPS (порты 80/443 TCP для API, 443 UDP для VPN).
# Переменные: WG_CLIENTS (2), WG_PORT (443 UDP), VPS_PUBLIC_IP
set -euo pipefail

WG_PORT="${WG_PORT:-443}"
WG_CLIENTS="${WG_CLIENTS:-2}"
WG_NET="10.66.66.0/24"
WG_SERVER_IP="10.66.66.1/24"
WG_DIR="/etc/wireguard"
CLIENT_DIR="/root/wireguard-clients"
STATE_DIR="${WG_DIR}/.state"

if [[ "${WG_CLIENTS}" =~ ^[0-9]+$ ]] && (( WG_CLIENTS < 1 || WG_CLIENTS > 10 )); then
  echo "WG_CLIENTS должен быть от 1 до 10"
  exit 1
fi

if ! command -v apt-get >/dev/null 2>&1; then
  echo "Скрипт рассчитан на Ubuntu/Debian с apt"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq wireguard wireguard-tools qrencode iptables

mkdir -p "${CLIENT_DIR}" "${STATE_DIR}"
chmod 700 "${CLIENT_DIR}" "${STATE_DIR}"

MAIN_IF="$(ip -4 route show default | awk '{print $5; exit}')"
if [[ -z "${MAIN_IF}" ]]; then
  echo "Не удалось определить сетевой интерфейс"
  exit 1
fi

PUBLIC_IP="${VPS_PUBLIC_IP:-}"
if [[ -z "${PUBLIC_IP}" ]]; then
  PUBLIC_IP="$(curl -fsS --max-time 5 https://api.ipify.org || true)"
fi
if [[ -z "${PUBLIC_IP}" ]]; then
  PUBLIC_IP="$(hostname -I | awk '{print $1}')"
fi

if [[ ! -f "${WG_DIR}/server_private.key" ]]; then
  umask 077
  wg genkey | tee "${WG_DIR}/server_private.key" | wg pubkey > "${WG_DIR}/server_public.key"
  chmod 600 "${WG_DIR}/server_private.key" "${WG_DIR}/server_public.key"
  echo "Сгенерированы ключи сервера WireGuard"
fi

SERVER_PRIVATE="$(tr -d '\n' < "${WG_DIR}/server_private.key")"
SERVER_PUBLIC="$(tr -d '\n' < "${WG_DIR}/server_public.key")"

cat > /etc/sysctl.d/99-wireguard.conf <<'SYSCTL'
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
SYSCTL
sysctl --system >/dev/null 2>&1 || sysctl -p /etc/sysctl.d/99-wireguard.conf >/dev/null

# UFW: WireGuard UDP (443 по умолчанию — меньше шансов блокировки, чем 51820)
if command -v ufw >/dev/null 2>&1; then
  ufw delete allow 51820/udp >/dev/null 2>&1 || true
  ufw allow "${WG_PORT}/udp" comment 'WireGuard VPN' >/dev/null 2>&1 || ufw allow "${WG_PORT}/udp"
  if grep -q 'DEFAULT_FORWARD_POLICY="DROP"' /etc/default/ufw 2>/dev/null; then
    sed -i 's/DEFAULT_FORWARD_POLICY="DROP"/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw
  fi
fi

{
  echo "[Interface]"
  echo "Address = ${WG_SERVER_IP}"
  echo "ListenPort = ${WG_PORT}"
  echo "PrivateKey = ${SERVER_PRIVATE}"
  echo "PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${MAIN_IF} -j MASQUERADE"
  echo "PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${MAIN_IF} -j MASQUERADE"
  echo
} > "${WG_DIR}/wg0.conf"
chmod 600 "${WG_DIR}/wg0.conf"

for (( i = 1; i <= WG_CLIENTS; i++ )); do
  CLIENT_IP="10.66.66.$((i + 1))"
  CLIENT_NAME="client-${i}"
  CLIENT_PRIV_FILE="${STATE_DIR}/${CLIENT_NAME}_private.key"
  CLIENT_PUB_FILE="${STATE_DIR}/${CLIENT_NAME}_public.key"
  CLIENT_CONF="${CLIENT_DIR}/${CLIENT_NAME}.conf"
  MARKER="${STATE_DIR}/${CLIENT_NAME}.done"

  if [[ ! -f "${CLIENT_PRIV_FILE}" ]]; then
    umask 077
    wg genkey | tee "${CLIENT_PRIV_FILE}" | wg pubkey > "${CLIENT_PUB_FILE}"
    chmod 600 "${CLIENT_PRIV_FILE}" "${CLIENT_PUB_FILE}"
  fi

  CLIENT_PRIVATE="$(tr -d '\n' < "${CLIENT_PRIV_FILE}")"
  CLIENT_PUBLIC="$(tr -d '\n' < "${CLIENT_PUB_FILE}")"

  if ! grep -q "# ${CLIENT_NAME}" "${WG_DIR}/wg0.conf" 2>/dev/null; then
    {
      echo "[Peer]"
      echo "# ${CLIENT_NAME}"
      echo "PublicKey = ${CLIENT_PUBLIC}"
      echo "AllowedIPs = ${CLIENT_IP}/32"
      echo
    } >> "${WG_DIR}/wg0.conf"
  fi

  cat > "${CLIENT_CONF}" <<CLIENT
[Interface]
PrivateKey = ${CLIENT_PRIVATE}
Address = ${CLIENT_IP}/32
DNS = 1.1.1.1, 1.0.0.1
MTU = 1280

[Peer]
PublicKey = ${SERVER_PUBLIC}
Endpoint = ${PUBLIC_IP}:${WG_PORT}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
CLIENT
  chmod 600 "${CLIENT_CONF}"
  touch "${MARKER}"
done

systemctl enable wg-quick@wg0 >/dev/null 2>&1 || true
if ! systemctl restart wg-quick@wg0 2>/dev/null; then
  echo "⚠ wg-quick не поднял интерфейс — пробуем wireguard-safe-up"
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [[ -f "${SCRIPT_DIR}/wireguard-safe-up.sh" ]]; then
    install -m 755 "${SCRIPT_DIR}/wireguard-safe-up.sh" /usr/local/sbin/wireguard-safe-up.sh
    install -m 755 "${SCRIPT_DIR}/wireguard-safe-down.sh" /usr/local/sbin/wireguard-safe-down.sh
    cat > /etc/systemd/system/wireguard-safe@.service <<'UNIT'
[Unit]
Description=WireGuard %i (safe up)
After=network-online.target
Wants=network-online.target
[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/sbin/wireguard-safe-up.sh /etc/wireguard/%i.conf
ExecStop=/usr/local/sbin/wireguard-safe-down.sh /etc/wireguard/%i.conf
[Install]
WantedBy=multi-user.target
UNIT
    systemctl disable --now wg-quick@wg0 2>/dev/null || true
    systemctl daemon-reload
    systemctl enable wireguard-safe@wg0
    systemctl restart wireguard-safe@wg0
  else
    echo "Нет wireguard-safe-up.sh рядом со скриптом"
    exit 1
  fi
fi
sleep 1

if command -v ufw >/dev/null 2>&1 && ip link show wg0 >/dev/null 2>&1; then
  ufw route allow in on wg0 out on "${MAIN_IF}" >/dev/null 2>&1 || true
  ufw route allow in on "${MAIN_IF}" out on wg0 >/dev/null 2>&1 || true
  ufw reload >/dev/null 2>&1 || true
fi

echo ""
echo "=== WireGuard ==="
wg show wg0 || true
echo ""
echo "Публичный Endpoint: ${PUBLIC_IP}:${WG_PORT}"
echo "Конфиги клиентов: ${CLIENT_DIR}/"
ls -1 "${CLIENT_DIR}"/*.conf 2>/dev/null || true

echo ""
echo "=== Проверка API (сайт не должен пострадать) ==="
curl -fsS http://127.0.0.1:4000/api/health && echo
curl -fsS https://api.nagaevomaster.ru/api/health && echo || curl -fsS http://127.0.0.1/api/health && echo || true

echo ""
echo "Готово. Импортируйте ${CLIENT_DIR}/client-1.conf в приложение WireGuard."
