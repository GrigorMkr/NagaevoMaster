#!/usr/bin/env bash
# Починить AWG-параметры для импорта в AmneziaVPN:
# - H1–H4: одно число (не диапазон 100000-800000)
# - I1: без кавычек, только на клиенте (CPS)
set -euo pipefail

AWG_DIR="/etc/amnezia/amneziawg"
CLIENT_DIR="/root/amnezia-clients"
STATE_DIR="${AWG_DIR}/.state"
PARAMS_FILE="${STATE_DIR}/awg-params.env"
SERVER_PRIV="${STATE_DIR}/server_private.key"
SERVER_PUB="${STATE_DIR}/server_public.key"
AWG_PORT="${AWG_PORT:-443}"
AWG_MTU="${AWG_MTU:-1420}"
AWG_DNS="${AWG_DNS:-1.1.1.1, 1.0.0.1}"

rand_range() {
  local min="$1" max="$2"
  echo $(( min + RANDOM % (max - min + 1) ))
}

pick_h() {
  local raw="$1" lo hi
  if [[ "${raw}" == *-* ]]; then
    lo="${raw%%-*}"
    hi="${raw#*-}"
    rand_range "${lo}" "${hi}"
  else
    echo "${raw}"
  fi
}

[[ -f "${PARAMS_FILE}" ]] || { echo "Сначала: npm run vps:amnezia"; exit 1; }
# shellcheck source=/dev/null
source "${PARAMS_FILE}"

AWG_H1="$(pick_h "${AWG_H1}")"
AWG_H2="$(pick_h "${AWG_H2}")"
AWG_H3="$(pick_h "${AWG_H3}")"
AWG_H4="$(pick_h "${AWG_H4}")"

# I1 — тег <r N>, без кавычек; 32–128 байт
if [[ "${AWG_I1}" =~ \<r\ ([0-9]+)\> ]]; then
  i1_n="${BASH_REMATCH[1]}"
elif [[ -n "${AWG_I1}" ]]; then
  i1_n="$(rand_range 32 128)"
else
  i1_n="$(rand_range 32 128)"
fi
AWG_I1="<r ${i1_n}>"

cat > "${PARAMS_FILE}" <<EOF
AWG_Jc=${AWG_Jc}
AWG_Jmin=${AWG_Jmin}
AWG_Jmax=${AWG_Jmax}
AWG_S1=${AWG_S1}
AWG_S2=${AWG_S2}
AWG_S3=${AWG_S3}
AWG_S4=${AWG_S4}
AWG_H1=${AWG_H1}
AWG_H2=${AWG_H2}
AWG_H3=${AWG_H3}
AWG_H4=${AWG_H4}
AWG_I1='${AWG_I1}'
EOF
chmod 600 "${PARAMS_FILE}"
# shellcheck source=/dev/null
source "${PARAMS_FILE}"

SERVER_PRIVATE="$(tr -d '\n' < "${SERVER_PRIV}")"
SERVER_PUBLIC="$(tr -d '\n' < "${SERVER_PUB}")"
PUBLIC_IP="${VPS_PUBLIC_IP:-}"
if [[ -z "${PUBLIC_IP}" ]]; then
  PUBLIC_IP="$(curl -fsS --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')"
fi
MAIN_IF="$(ip -4 route show default | awk '{print $5; exit}')"

echo "==> Сервер awg0.conf (без I1 — CPS только на клиенте)"
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

if [[ -f "${AWG_DIR}/awg0.conf" ]]; then
  awk '/^\[Peer\]/{found=1} found' "${AWG_DIR}/awg0.conf" >> "${AWG_DIR}/awg0.conf.new" || true
fi
mv "${AWG_DIR}/awg0.conf.new" "${AWG_DIR}/awg0.conf"
chmod 600 "${AWG_DIR}/awg0.conf"

echo "==> Клиентские конфиги (I1 = ${AWG_I1}, без кавычек)"
shopt -s nullglob
for CLIENT_PRIV in "${STATE_DIR}"/amnezia-*_private.key; do
  CLIENT_NAME="$(basename "${CLIENT_PRIV}" _private.key)"
  CLIENT_CONF="${CLIENT_DIR}/${CLIENT_NAME}.conf"
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
  if command -v qrencode >/dev/null 2>&1; then
    qrencode -o "${CLIENT_DIR}/${CLIENT_NAME}.png" < "${CLIENT_CONF}" 2>/dev/null || true
  fi
  echo "  ${CLIENT_NAME}.conf"
done

systemctl restart awg-quick@awg0 2>/dev/null || awg-quick up awg0 2>/dev/null || true
echo ""
echo "H1=${AWG_H1} H2=${AWG_H2} H3=${AWG_H3} H4=${AWG_H4}"
echo "I1=${AWG_I1} (только в клиентском .conf)"
echo "Готово."
