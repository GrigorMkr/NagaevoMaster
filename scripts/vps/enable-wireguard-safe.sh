#!/usr/bin/env bash
set -euo pipefail
install -m 755 /tmp/wireguard-safe-up.sh /usr/local/sbin/wireguard-safe-up.sh
install -m 755 /tmp/wireguard-safe-down.sh /usr/local/sbin/wireguard-safe-down.sh

cat > /etc/systemd/system/wireguard-safe@.service <<'UNIT'
[Unit]
Description=WireGuard %i (safe up)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/sbin/wireguard-safe-up.sh /etc/wireguard/%i.conf
ExecStop=/usr/local/sbin/wireguard-safe-down.sh /etc/wireguard/%i.conf

[Install]
WantedBy=multi-user.target
UNIT

systemctl disable --now wg-quick@wg0 2>/dev/null || true
systemctl daemon-reload
systemctl enable wireguard-safe@wg0
systemctl restart wireguard-safe@wg0
sleep 1
wg show wg0
echo "=== youtube ==="
curl -sI --max-time 8 https://www.youtube.com | head -3
