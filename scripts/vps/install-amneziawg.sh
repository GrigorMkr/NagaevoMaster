#!/usr/bin/env bash
# AmneziaWG 2.0 на VPS рядом с API (443 TCP — nginx, 443 UDP — AmneziaWG).
# Останавливает обычный WireGuard (wg0), не трогает Node/nginx/PostgreSQL.
set -euo pipefail

AWG_PORT="${AWG_PORT:-443}"
AWG_CLIENTS="${AWG_CLIENTS:-2}"
AWG_DIR="/etc/amnezia/amneziawg"
CLIENT_DIR="/root/amnezia-clients"
STATE_DIR="${AWG_DIR}/.state"
PARAMS_FILE="${STATE_DIR}/awg-params.env"
SERVER_PRIV="${STATE_DIR}/server_private.key"
SERVER_PUB="${STATE_DIR}/server_public.key"
AWG_SUBNET="10.77.77.0/24"
AWG_SERVER_IP="10.77.77.1/24"

rand_range() {
  local min="$1" max="$2"
  echo $(( min + RANDOM % (max - min + 1) ))
}

generate_awg_params() {
  if [[ -f "${PARAMS_FILE}" ]]; then
    if # shellcheck source=/dev/null
      source "${PARAMS_FILE}" 2>/dev/null; then
      return
    fi
    rm -f "${PARAMS_FILE}"
  fi

  local jc jmin jmax s1 s2 s3 s4
  jc=$(rand_range 4 8)
  jmin=$(rand_range 40 89)
  jmax=$(( jmin + $(rand_range 100 999) ))
  s1=$(rand_range 15 150)
  s2=$(rand_range 15 150)
  while [[ $((s1 + 56)) -eq s2 ]]; do
    s2=$(rand_range 15 150)
  done
  s3=$(rand_range 8 55)
  s4=$(rand_range 4 27)
  local i1_n
  i1_n=$(rand_range 32 256)

  mkdir -p "${STATE_DIR}"
  cat > "${PARAMS_FILE}" <<EOF
AWG_Jc=${jc}
AWG_Jmin=${jmin}
AWG_Jmax=${jmax}
AWG_S1=${s1}
AWG_S2=${s2}
AWG_S3=${s3}
AWG_S4=${s4}
  AWG_H1=$(rand_range 100000 800000)
  AWG_H2=$(rand_range 1000000 8000000)
  AWG_H3=$(rand_range 10000000 80000000)
  AWG_H4=$(rand_range 100000000 800000000)
  AWG_I1="<r ${i1_n}>"
EOF
  chmod 600 "${PARAMS_FILE}"
  # shellcheck source=/dev/null
  source "${PARAMS_FILE}"
}

if [[ "${AWG_CLIENTS}" =~ ^[0-9]+$ ]] && (( AWG_CLIENTS < 1 || AWG_CLIENTS > 10 )); then
  echo "AWG_CLIENTS должен быть от 1 до 10"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Остановка обычного WireGuard (wg0)"
systemctl stop wg-quick@wg0 2>/dev/null || true
systemctl disable wg-quick@wg0 2>/dev/null || true

echo "==> Установка AmneziaWG из официального PPA"
apt-get update -qq
apt-get install -y -qq software-properties-common gnupg2 curl qrencode \
  "linux-headers-$(uname -r)" linux-headers-generic build-essential dpkg-dev

if [[ ! -f /etc/apt/sources.list.d/amnezia-ppa.sources ]] \
  && [[ ! -f /etc/apt/sources.list.d/amnezia-ubuntu-ppa-"$(lsb_release -sc)".list ]]; then
  CODENAME="$(lsb_release -sc)"
  if [[ "${CODENAME}" == "resolute" ]] || [[ "$(lsb_release -rs)" == "26.04" ]]; then
    echo "⚠ Ubuntu 26.04: PPA Amnezia недоступен. Используйте Ubuntu 22.04/24.04 или: npm run vps:wireguard"
    exit 1
  fi
  add-apt-repository -y ppa:amnezia/ppa
fi
apt-get update -qq
apt-get install -y -qq amneziawg-dkms amneziawg-tools wireguard-tools dkms

# Пересборка DKMS под текущее ядро
KVER="$(uname -r)"
if ! dkms status amneziawg/1.0.0 2>/dev/null | grep -q "${KVER}.*installed"; then
  apt-get install -y -qq "linux-headers-${KVER}" 2>/dev/null || true
  dkms install amneziawg/1.0.0 -k "${KVER}" 2>/dev/null \
    || dkms autoinstall 2>/dev/null \
    || echo "⚠ DKMS: нужна перезагрузка VPS для модуля amneziawg"
fi
modprobe amneziawg 2>/dev/null || true

mkdir -p "${AWG_DIR}" "${CLIENT_DIR}" "${STATE_DIR}"
chmod 700 "${AWG_DIR}" "${CLIENT_DIR}" "${STATE_DIR}"
# Миграция со старого пути
if [[ -f /etc/amneziawg/awg0.conf ]] && [[ ! -f "${AWG_DIR}/awg0.conf" ]]; then
  cp -a /etc/amneziawg/.state "${AWG_DIR}/" 2>/dev/null || true
  cp /etc/amneziawg/awg0.conf "${AWG_DIR}/awg0.conf" 2>/dev/null || true
fi

MAIN_IF="$(ip -4 route show default | awk '{print $5; exit}')"
PUBLIC_IP="${VPS_PUBLIC_IP:-}"
if [[ -z "${PUBLIC_IP}" ]]; then
  PUBLIC_IP="$(curl -fsS --max-time 5 https://api.ipify.org || true)"
fi
if [[ -z "${PUBLIC_IP}" ]]; then
  PUBLIC_IP="$(hostname -I | awk '{print $1}')"
fi

if [[ ! -f "${SERVER_PRIV}" ]]; then
  umask 077
  awg genkey | tee "${SERVER_PRIV}" | awg pubkey > "${SERVER_PUB}"
  chmod 600 "${SERVER_PRIV}" "${SERVER_PUB}"
  echo "Сгенерированы ключи AmneziaWG"
fi

generate_awg_params
SERVER_PRIVATE="$(tr -d '\n' < "${SERVER_PRIV}")"
SERVER_PUBLIC="$(tr -d '\n' < "${SERVER_PUB}")"

cat > /etc/sysctl.d/99-amneziawg.conf <<'SYS'
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
SYS
sysctl --system >/dev/null 2>&1 || sysctl -p /etc/sysctl.d/99-amneziawg.conf >/dev/null

if command -v ufw >/dev/null 2>&1; then
  ufw delete allow 51820/udp >/dev/null 2>&1 || true
  ufw allow "${AWG_PORT}/udp" comment 'AmneziaWG' >/dev/null 2>&1 || ufw allow "${AWG_PORT}/udp"
fi

{
  echo "[Interface]"
  echo "Address = ${AWG_SERVER_IP}"
  echo "ListenPort = ${AWG_PORT}"
  echo "PrivateKey = ${SERVER_PRIVATE}"
  echo "Jc = ${AWG_Jc}"
  echo "Jmin = ${AWG_Jmin}"
  echo "Jmax = ${AWG_Jmax}"
  echo "S1 = ${AWG_S1}"
  echo "S2 = ${AWG_S2}"
  echo "S3 = ${AWG_S3}"
  echo "S4 = ${AWG_S4}"
  echo "H1 = ${AWG_H1}"
  echo "H2 = ${AWG_H2}"
  echo "H3 = ${AWG_H3}"
  echo "H4 = ${AWG_H4}"
  echo "PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${MAIN_IF} -j MASQUERADE"
  echo "PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${MAIN_IF} -j MASQUERADE"
  echo
} > "${AWG_DIR}/awg0.conf"
chmod 600 "${AWG_DIR}/awg0.conf"

for (( i = 1; i <= AWG_CLIENTS; i++ )); do
  CLIENT_IP="10.77.77.$((i + 1))"
  CLIENT_NAME="amnezia-${i}"
  CLIENT_PRIV="${STATE_DIR}/${CLIENT_NAME}_private.key"
  CLIENT_PUB="${STATE_DIR}/${CLIENT_NAME}_public.key"
  CLIENT_CONF="${CLIENT_DIR}/${CLIENT_NAME}.conf"

  if [[ ! -f "${CLIENT_PRIV}" ]]; then
    umask 077
    awg genkey | tee "${CLIENT_PRIV}" | awg pubkey > "${CLIENT_PUB}"
    chmod 600 "${CLIENT_PRIV}" "${CLIENT_PUB}"
  fi

  CLIENT_PRIVATE="$(tr -d '\n' < "${CLIENT_PRIV}")"
  CLIENT_PUBLIC="$(tr -d '\n' < "${CLIENT_PUB}")"

  if ! grep -q "# ${CLIENT_NAME}" "${AWG_DIR}/awg0.conf" 2>/dev/null; then
    {
      echo "[Peer]"
      echo "# ${CLIENT_NAME}"
      echo "PublicKey = ${CLIENT_PUBLIC}"
      echo "AllowedIPs = ${CLIENT_IP}/32"
      echo
    } >> "${AWG_DIR}/awg0.conf"
  fi

  cat > "${CLIENT_CONF}" <<CLIENT
[Interface]
PrivateKey = ${CLIENT_PRIVATE}
Address = ${CLIENT_IP}/32
DNS = 1.1.1.1, 1.0.0.1
MTU = 1420
Jc = ${AWG_Jc}
Jmin = ${AWG_Jmin}
Jmax = ${AWG_Jmax}
S1 = ${AWG_S1}
S2 = ${AWG_S2}
S3 = ${AWG_S3}
S4 = ${AWG_S4}
H1 = ${AWG_H1}
H2 = ${AWG_H2}
H3 = ${AWG_H3}
H4 = ${AWG_H4}
I1 = ${AWG_I1}

[Peer]
PublicKey = ${SERVER_PUBLIC}
Endpoint = ${PUBLIC_IP}:${AWG_PORT}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
CLIENT
  chmod 600 "${CLIENT_CONF}"

  if command -v qrencode >/dev/null 2>&1; then
    qrencode -o "${CLIENT_DIR}/${CLIENT_NAME}.png" < "${CLIENT_CONF}" 2>/dev/null || true
  fi
done

# Конфиг: /etc/amneziawg/awg0.conf (awg-quick@awg0)

systemctl enable awg-quick@awg0 >/dev/null 2>&1 || true
if ! systemctl restart awg-quick@awg0; then
  echo ""
  if [[ "$(uname -r)" != *"$(dpkg -l linux-image-virtual 2>/dev/null | awk '/^ii/{print $3}' | cut -d- -f1-3 | head -1)"* ]] 2>/dev/null; then
    echo "⚠ Нужна перезагрузка VPS (новое ядро для AmneziaWG). Выполните:"
    echo "   npm run vps:reboot && npm run vps:amnezia"
  fi
  journalctl -u awg-quick@awg0 -n 15 --no-pager || true
fi
sleep 1

if command -v ufw >/dev/null 2>&1 && ip link show awg0 >/dev/null 2>&1; then
  ufw route allow in on awg0 out on "${MAIN_IF}" >/dev/null 2>&1 || true
  ufw route allow in on "${MAIN_IF}" out on awg0 >/dev/null 2>&1 || true
  ufw reload >/dev/null 2>&1 || true
fi

echo ""
echo "=== AmneziaWG ==="
awg show awg0 2>/dev/null || wg show awg0 2>/dev/null || echo "(интерфейс awg0 ещё не поднят — попробуйте reboot)"
echo ""
echo "Endpoint: ${PUBLIC_IP}:${AWG_PORT}"
echo "Конфиги: ${CLIENT_DIR}/"
ls -1 "${CLIENT_DIR}"/*.conf 2>/dev/null || true

echo ""
echo "=== API ==="
curl -fsS http://127.0.0.1:4000/api/health && echo
curl -fsS https://api.nagaevomaster.ru/api/health && echo || true

echo ""
echo "Импорт в AmneziaVPN: ${CLIENT_DIR}/amnezia-1.conf или QR ${CLIENT_DIR}/amnezia-1.png"
