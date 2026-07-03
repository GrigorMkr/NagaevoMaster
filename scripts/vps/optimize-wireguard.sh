#!/usr/bin/env bash
# Ускорение WireGuard: BBR, буферы, MTU, порт 443/UDP (лучше проходит у провайдеров).
set -euo pipefail

WG_PORT="${WG_PORT:-443}"
WG_MTU="${WG_MTU:-1360}"
WG_DIR="/etc/wireguard"
CLIENT_DIR="/root/wireguard-clients"
STATE_DIR="${WG_DIR}/.state"
CONF="${WG_DIR}/wg0.conf"
MAIN_IF="$(ip -4 route show default | awk '{print $5; exit}')"
PUBLIC_IP="${VPS_PUBLIC_IP:-$(curl -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')}"
SERVER_PUBLIC="$(tr -d '\n' < "${WG_DIR}/server_public.key")"

echo "==> sysctl (BBR, буферы, MTU probe)"
cat > /etc/sysctl.d/99-wireguard-perf.conf <<'SYS'
net.core.rmem_max = 2500000
net.core.wmem_max = 2500000
net.core.rmem_default = 212992
net.core.wmem_default = 212992
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
net.ipv4.tcp_mtu_probing = 1
net.ipv4.ip_forward = 1
net.ipv4.conf.all.forwarding = 1
net.ipv4.conf.wg0.rp_filter = 0
SYS
sysctl --system >/dev/null 2>&1 || true

modprobe tcp_bbr 2>/dev/null || true

echo "==> wg0.conf (порт ${WG_PORT}, MTU ${WG_MTU})"
SERVER_PRIVATE="$(tr -d '\n' < "${WG_DIR}/server_private.key")"
{
  echo "[Interface]"
  echo "Address = 10.66.66.1/24"
  echo "ListenPort = ${WG_PORT}"
  echo "MTU = ${WG_MTU}"
  echo "PrivateKey = ${SERVER_PRIVATE}"
  echo "PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${MAIN_IF} -j MASQUERADE; iptables -t mangle -A FORWARD -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu"
  echo "PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${MAIN_IF} -j MASQUERADE; iptables -t mangle -D FORWARD -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu"
  echo
} > "${CONF}.new"

awk '/^\[Peer\]/{found=1} found' "${CONF}" >> "${CONF}.new" 2>/dev/null || true
mv "${CONF}.new" "${CONF}"
chmod 600 "${CONF}"

echo "==> клиенты (MTU ${WG_MTU}, keepalive 15)"
shopt -s nullglob
for CLIENT_PRIV in "${STATE_DIR}"/client-*_private.key; do
  CLIENT_NAME="$(basename "${CLIENT_PRIV}" _private.key)"
  CLIENT_CONF="${CLIENT_DIR}/${CLIENT_NAME}.conf"
  CLIENT_PRIVATE="$(tr -d '\n' < "${CLIENT_PRIV}")"
  num="${CLIENT_NAME#client-}"
  CLIENT_IP="10.66.66.$((num + 1))"

  cat > "${CLIENT_CONF}" <<CLIENT
[Interface]
PrivateKey = ${CLIENT_PRIVATE}
Address = ${CLIENT_IP}/32
DNS = 1.1.1.1, 8.8.8.8
MTU = ${WG_MTU}

[Peer]
PublicKey = ${SERVER_PUBLIC}
Endpoint = ${PUBLIC_IP}:${WG_PORT}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 15
CLIENT
  chmod 600 "${CLIENT_CONF}"
  qrencode -o "${CLIENT_DIR}/${CLIENT_NAME}.png" < "${CLIENT_CONF}" 2>/dev/null || true
  echo "  ${CLIENT_NAME}.conf"
done

cp "${CLIENT_DIR}/client-2.conf" "${CLIENT_DIR}/keenetic-router.conf"
cp "${CLIENT_DIR}/client-2.png" "${CLIENT_DIR}/keenetic-router.png" 2>/dev/null || true

if command -v ufw >/dev/null 2>&1; then
  ufw allow "${WG_PORT}/udp" comment 'WireGuard' >/dev/null 2>&1 || true
fi

systemctl restart wireguard-safe@wg0

echo ""
echo "=== OK: порт ${WG_PORT}/udp, MTU ${WG_MTU} ==="
wg show wg0
ls -1 "${CLIENT_DIR}"/*.conf
