#!/usr/bin/env bash
# Обход wg-quick: на некоторых VPS «ip link set mtu … up» даёт Permission denied.
set -euo pipefail

CONF="${1:-/etc/wireguard/wg0.conf}"
IFACE="$(basename "${CONF}" .conf)"
MAIN_IF="$(ip -4 route show default | awk '{print $5; exit}')"
ADDR="$(awk -F' = ' '/^Address/{print $2; exit}' "${CONF}")"
MTU="$(awk -F' = ' '/^MTU/{print $2; exit}' "${CONF}")"
MTU="${MTU:-1420}"

ip link del "${IFACE}" 2>/dev/null || true
ip link add dev "${IFACE}" type wireguard
wg setconf "${IFACE}" <(wg-quick strip "${CONF}")
ip link set "${IFACE}" up
ip -4 addr add "${ADDR}" dev "${IFACE}" 2>/dev/null || true
ip link set mtu "${MTU}" dev "${IFACE}" 2>/dev/null || true

# PostUp из конфига
POST_UP="$(awk -F' = ' '/^PostUp/{print $2; exit}' "${CONF}" | sed "s/%i/${IFACE}/g")"
if [[ -n "${POST_UP}" ]]; then
  bash -c "${POST_UP}"
fi

echo "wg0 up (${IFACE}, ${MAIN_IF})"
wg show "${IFACE}"
