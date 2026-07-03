#!/usr/bin/env bash
# Починить маршрутизацию WireGuard: без IPv6 в AllowedIPs, MSS clamp, sysctl.
set -euo pipefail

WG_DIR="/etc/wireguard"
CLIENT_DIR="/root/wireguard-clients"
STATE_DIR="${WG_DIR}/.state"
CONF="${WG_DIR}/wg0.conf"
MAIN_IF="$(ip -4 route show default | awk '{print $5; exit}')"
PUBLIC_IP="${VPS_PUBLIC_IP:-$(curl -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')}"
SERVER_PUBLIC="$(tr -d '\n' < "${WG_DIR}/server_public.key")"

echo "==> sysctl (форвардинг, без строгого rp_filter на wg0)"
cat > /etc/sysctl.d/99-wireguard-forward.conf <<SYS
net.ipv4.ip_forward = 1
net.ipv4.conf.all.forwarding = 1
net.ipv4.conf.${MAIN_IF}.forwarding = 1
net.ipv4.conf.wg0.rp_filter = 0
SYS
sysctl --system >/dev/null 2>&1 || true

echo "==> Сервер wg0.conf (MSS clamp)"
SERVER_PRIVATE="$(tr -d '\n' < "${WG_DIR}/server_private.key")"
{
  echo "[Interface]"
  echo "Address = 10.66.66.1/24"
  echo "ListenPort = 443"
  echo "PrivateKey = ${SERVER_PRIVATE}"
  echo "PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o ${MAIN_IF} -j MASQUERADE; iptables -t mangle -A FORWARD -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu"
  echo "PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o ${MAIN_IF} -j MASQUERADE; iptables -t mangle -D FORWARD -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu"
  echo
} > "${CONF}.new"

awk '/^\[Peer\]/{found=1} found' "${CONF}" >> "${CONF}.new" 2>/dev/null || true
mv "${CONF}.new" "${CONF}"
chmod 600 "${CONF}"

echo "==> Клиенты: только IPv4 (0.0.0.0/0), DNS Cloudflare"
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
DNS = 1.1.1.1, 1.0.0.1
MTU = 1280

[Peer]
PublicKey = ${SERVER_PUBLIC}
Endpoint = ${PUBLIC_IP}:443
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
CLIENT
  chmod 600 "${CLIENT_CONF}"
  qrencode -o "${CLIENT_DIR}/${CLIENT_NAME}.png" < "${CLIENT_CONF}" 2>/dev/null || true
  echo "  ${CLIENT_NAME}.conf"
done

systemctl restart wireguard-safe@wg0 2>/dev/null || /usr/local/sbin/wireguard-safe-up.sh "${CONF}"
echo "Готово. Переимпортируйте client-1.conf"
