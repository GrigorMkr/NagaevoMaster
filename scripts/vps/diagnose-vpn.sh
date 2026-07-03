#!/usr/bin/env bash
set -euo pipefail
echo "=== awg0 ==="
awg show awg0 2>/dev/null || echo "no awg"
echo "=== ip forward ==="
sysctl net.ipv4.ip_forward
echo "=== nat ==="
iptables -t nat -L POSTROUTING -n -v | head -6
echo "=== forward ==="
iptables -L FORWARD -n -v | head -8
echo "=== dns youtube ==="
dig +short youtube.com @1.1.1.1 2>/dev/null || nslookup youtube.com 1.1.1.1 2>/dev/null | head -6
echo "=== curl youtube ==="
curl -sI --max-time 10 https://www.youtube.com 2>&1 | head -6
echo "=== curl google ==="
curl -sI --max-time 10 https://www.google.com 2>&1 | head -6
echo "=== mtu ==="
ip link show awg0 2>/dev/null | head -2 || true
echo "=== client conf ==="
grep -E 'DNS|MTU|AllowedIPs' /root/amnezia-clients/amnezia-1.conf 2>/dev/null || true
echo "=== ufw ==="
ufw status 2>/dev/null | head -5 || true
