#!/usr/bin/env bash
set -x
ip link del wg0 2>/dev/null || true
ip link add dev wg0 type wireguard
wg setconf wg0 <(wg-quick strip wg0 /etc/wireguard/wg0.conf)
ip link set dev wg0 up
ip -4 address add 10.66.66.1/24 dev wg0
ip link set mtu 1420 dev wg0
ip link show wg0
wg show wg0
