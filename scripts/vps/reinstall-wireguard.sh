#!/usr/bin/env bash
# Полная переустановка WireGuard: новые ключи, 3 клиента, порт 51820.
#   WG_REGENERATE=1 bash reinstall-wireguard.sh
set -euo pipefail

WG_PORT="${WG_PORT:-51820}"
WG_CLIENTS="${WG_CLIENTS:-3}"
WG_DIR="/etc/wireguard"
CLIENT_DIR="/root/wireguard-clients"
STATE_DIR="${WG_DIR}/.state"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq wireguard wireguard-tools qrencode iptables curl

systemctl stop wireguard-safe@wg0 wg-quick@wg0 2>/dev/null || true
ip link del wg0 2>/dev/null || true

rm -rf "${STATE_DIR}"
mkdir -p "${CLIENT_DIR}" "${STATE_DIR}"
chmod 700 "${CLIENT_DIR}" "${STATE_DIR}"

MAIN_IF="$(ip -4 route show default | awk '{print $5; exit}')"
PUBLIC_IP="${VPS_PUBLIC_IP:-$(curl -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')}"

umask 077
wg genkey | tee "${WG_DIR}/server_private.key" | wg pubkey > "${WG_DIR}/server_public.key"
chmod 600 "${WG_DIR}/server_private.key" "${WG_DIR}/server_public.key"
SERVER_PRIVATE="$(tr -d '\n' < "${WG_DIR}/server_private.key")"
SERVER_PUBLIC="$(tr -d '\n' < "${WG_DIR}/server_public.key")"

cat > /etc/sysctl.d/99-wireguard.conf <<'SYS'
net.ipv4.ip_forward=1
net.ipv4.conf.all.forwarding=1
net.ipv4.conf.wg0.rp_filter=0
SYS
sysctl --system >/dev/null 2>&1 || true

if command -v ufw >/dev/null 2>&1; then
  ufw allow "${WG_PORT}/udp" comment 'WireGuard' >/dev/null 2>&1 || true
  ufw allow 443/udp comment 'WireGuard alt' >/dev/null 2>&1 || true
  grep -q 'DEFAULT_FORWARD_POLICY="DROP"' /etc/default/ufw 2>/dev/null \
    && sed -i 's/DEFAULT_FORWARD_POLICY="DROP"/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw || true
fi

{
  echo "[Interface]"
  echo "Address = 10.66.66.1/24"
  echo "ListenPort = ${WG_PORT}"
  echo "PrivateKey = ${SERVER_PRIVATE}"
  echo "PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${MAIN_IF} -j MASQUERADE; iptables -t mangle -A FORWARD -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu"
  echo "PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${MAIN_IF} -j MASQUERADE; iptables -t mangle -D FORWARD -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu"
  echo
} > "${WG_DIR}/wg0.conf"

for (( i = 1; i <= WG_CLIENTS; i++ )); do
  CLIENT_IP="10.66.66.$((i + 1))"
  CLIENT_NAME="client-${i}"
  CLIENT_PRIV="${STATE_DIR}/${CLIENT_NAME}_private.key"
  CLIENT_PUB="${STATE_DIR}/${CLIENT_NAME}_public.key"
  CLIENT_CONF="${CLIENT_DIR}/${CLIENT_NAME}.conf"

  wg genkey | tee "${CLIENT_PRIV}" | wg pubkey > "${CLIENT_PUB}"
  chmod 600 "${CLIENT_PRIV}" "${CLIENT_PUB}"
  CLIENT_PRIVATE="$(tr -d '\n' < "${CLIENT_PRIV}")"
  CLIENT_PUBLIC="$(tr -d '\n' < "${CLIENT_PUB}")"

  {
    echo "[Peer]"
    echo "# ${CLIENT_NAME}"
    echo "PublicKey = ${CLIENT_PUBLIC}"
    echo "AllowedIPs = ${CLIENT_IP}/32"
    echo
  } >> "${WG_DIR}/wg0.conf"

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
  qrencode -o "${CLIENT_DIR}/${CLIENT_NAME}.png" < "${CLIENT_CONF}" 2>/dev/null || true
done

cp "${CLIENT_DIR}/client-2.conf" "${CLIENT_DIR}/keenetic-router.conf"
cp "${CLIENT_DIR}/client-2.png" "${CLIENT_DIR}/keenetic-router.png" 2>/dev/null || true

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

echo ""
echo "=== WireGuard OK ==="
wg show wg0
echo ""
echo "Endpoint: ${PUBLIC_IP}:${WG_PORT}"
echo "client-1 = телефон/ПК"
echo "client-2 = Keenetic (keenetic-router.conf)"
echo "client-3 = запасной"
ls -1 "${CLIENT_DIR}"/*.conf
