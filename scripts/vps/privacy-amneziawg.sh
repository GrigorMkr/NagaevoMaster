#!/usr/bin/env bash
# Приватность AmneziaWG: международный DNS, без утечки IPv6, полный туннель.
set -euo pipefail

AWG_DIR="/etc/amnezia/amneziawg"
CLIENT_DIR="/root/amnezia-clients"
STATE_DIR="${AWG_DIR}/.state"
PARAMS_FILE="${STATE_DIR}/awg-params.env"
SERVER_PRIV="${STATE_DIR}/server_private.key"
SERVER_PUB="${STATE_DIR}/server_public.key"
AWG_MTU="${AWG_MTU:-1420}"
AWG_PORT="${AWG_PORT:-443}"
AWG_DNS="${AWG_DNS:-1.1.1.1, 1.0.0.1}"

[[ -f "${PARAMS_FILE}" ]] || { echo "Сначала: npm run vps:amnezia"; exit 1; }

# shellcheck source=/dev/null
source "${PARAMS_FILE}"
SERVER_PRIVATE="$(tr -d '\n' < "${SERVER_PRIV}")"
SERVER_PUBLIC="$(tr -d '\n' < "${SERVER_PUB}")"
PUBLIC_IP="${VPS_PUBLIC_IP:-$(curl -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')}"

echo "==> Блокировка IPv6-обхода на сервере (трафик клиентов только IPv4)"
cat > /etc/sysctl.d/99-amnezia-privacy.conf <<'SYS'
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 0
SYS
sysctl --system >/dev/null 2>&1 || true

echo "==> Клиенты: DNS ${AWG_DNS}, только IPv4 через туннель (без ::/0)"
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
DNS = ${AWG_DNS}
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

systemctl restart awg-quick@awg0 2>/dev/null || true
echo ""
echo "Готово. Переимпортируйте конфиг в AmneziaVPN."
