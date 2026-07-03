#!/usr/bin/env bash
# Ускорение AmneziaWG: MTU, BBR, буферы, MSS clamp. API не трогаем.
set -euo pipefail

AWG_DIR="/etc/amnezia/amneziawg"
CLIENT_DIR="/root/amnezia-clients"
STATE_DIR="${AWG_DIR}/.state"
PARAMS_FILE="${STATE_DIR}/awg-params.env"
SERVER_PRIV="${STATE_DIR}/server_private.key"
SERVER_PUB="${STATE_DIR}/server_public.key"
AWG_MTU="${AWG_MTU:-1420}"
AWG_PORT="${AWG_PORT:-443}"

if [[ ! -f "${PARAMS_FILE}" ]] || [[ ! -f "${SERVER_PRIV}" ]]; then
  echo "Сначала: npm run vps:amnezia"
  exit 1
fi

# shellcheck source=/dev/null
source "${PARAMS_FILE}"
SERVER_PRIVATE="$(tr -d '\n' < "${SERVER_PRIV}")"
SERVER_PUBLIC="$(tr -d '\n' < "${SERVER_PUB}")"

PUBLIC_IP="${VPS_PUBLIC_IP:-}"
if [[ -z "${PUBLIC_IP}" ]]; then
  PUBLIC_IP="$(curl -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')"
fi

MAIN_IF="$(ip -4 route show default | awk '{print $5; exit}')"

echo "==> Сеть: BBR + буферы"
cat > /etc/sysctl.d/99-amnezia-speed.conf <<'SYS'
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 16384
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1
SYS
sysctl --system >/dev/null 2>&1 || sysctl -p /etc/sysctl.d/99-amnezia-speed.conf >/dev/null
echo "  tcp_congestion_control=$(sysctl -n net.ipv4.tcp_congestion_control)"

echo "==> MTU ${AWG_MTU} + MSS clamp на awg0"
{
  echo "[Interface]"
  echo "Address = 10.77.77.1/24"
  echo "ListenPort = ${AWG_PORT}"
  echo "MTU = ${AWG_MTU}"
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
  echo "PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${MAIN_IF} -j MASQUERADE; iptables -t mangle -A FORWARD -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu"
  echo "PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${MAIN_IF} -j MASQUERADE; iptables -t mangle -D FORWARD -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu"
  echo
} > "${AWG_DIR}/awg0.conf.new"

# Сохранить [Peer] блоки
if [[ -f "${AWG_DIR}/awg0.conf" ]]; then
  awk '/^\[Peer\]/{found=1} found' "${AWG_DIR}/awg0.conf" >> "${AWG_DIR}/awg0.conf.new" || true
fi
mv "${AWG_DIR}/awg0.conf.new" "${AWG_DIR}/awg0.conf"
chmod 600 "${AWG_DIR}/awg0.conf"

echo "==> Обновление клиентских конфигов (MTU ${AWG_MTU})"
shopt -s nullglob
for CLIENT_PRIV in "${STATE_DIR}"/amnezia-*_private.key; do
  CLIENT_NAME="$(basename "${CLIENT_PRIV}" _private.key)"
  CLIENT_PUB="${STATE_DIR}/${CLIENT_NAME}_public.key"
  CLIENT_CONF="${CLIENT_DIR}/${CLIENT_NAME}.conf"
  [[ -f "${CLIENT_PUB}" ]] || continue

  CLIENT_PRIVATE="$(tr -d '\n' < "${CLIENT_PRIV}")"
  num="${CLIENT_NAME#amnezia-}"
  CLIENT_IP="10.77.77.$((num + 1))"

  cat > "${CLIENT_CONF}" <<CLIENT
[Interface]
PrivateKey = ${CLIENT_PRIVATE}
Address = ${CLIENT_IP}/32
DNS = 1.1.1.1, 1.0.0.1
MTU = ${AWG_MTU}
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
  qrencode -o "${CLIENT_DIR}/${CLIENT_NAME}.png" < "${CLIENT_CONF}" 2>/dev/null || true
  echo "  ${CLIENT_NAME}.conf"
done

systemctl restart awg-quick@awg0
sleep 1

echo ""
awg show awg0 2>/dev/null | head -20 || true
echo ""
echo "=== Пропускная способность канала VPS (примерно) ==="
if command -v curl >/dev/null 2>&1; then
  curl -fsS --max-time 15 -o /dev/null -w "Скачивание с VPS: %{speed_download} байт/с\n" \
    https://speed.hetzner.de/100MB.bin 2>/dev/null \
    || curl -fsS --max-time 10 -o /dev/null -w "Тест: %{speed_download} байт/с\n" https://cachefly.cachefly.net/10mb.test 2>/dev/null \
    || echo "(внешний speedtest недоступен)"
fi
curl -fsS http://127.0.0.1:4000/api/health && echo
echo ""
echo "Импортируйте обновлённые конфиги из ${CLIENT_DIR}/ (MTU ${AWG_MTU})"
