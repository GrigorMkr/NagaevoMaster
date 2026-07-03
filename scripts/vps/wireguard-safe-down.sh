#!/usr/bin/env bash
set -euo pipefail
CONF="${1:-/etc/wireguard/wg0.conf}"
IFACE="$(basename "${CONF}" .conf)"

POST_DOWN="$(awk -F' = ' '/^PostDown/{print $2; exit}' "${CONF}" | sed "s/%i/${IFACE}/g")"
if [[ -n "${POST_DOWN}" ]]; then
  bash -c "${POST_DOWN}" 2>/dev/null || true
fi
ip link del "${IFACE}" 2>/dev/null || true
