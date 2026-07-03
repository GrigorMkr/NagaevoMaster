#!/usr/bin/env bash
echo "=== wg0 ==="
wg show wg0 2>/dev/null || echo NO_WG
echo "=== ip forward ==="
sysctl net.ipv4.ip_forward
echo "=== iptables nat ==="
iptables -t nat -L POSTROUTING -n -v | head -5
echo "=== iptables forward ==="
iptables -L FORWARD -n -v | head -8
echo "=== ufw ==="
ufw status 2>/dev/null | head -8 || echo no ufw
echo "=== routes ==="
ip route | head -5
echo "=== ping client subnet ==="
ping -c 1 -W 2 10.66.66.2 2>&1 | tail -2
echo "=== curl youtube ==="
curl -sI --max-time 8 https://www.youtube.com | head -3
echo "=== nft ==="
nft list ruleset 2>/dev/null | head -20 || echo no nft
