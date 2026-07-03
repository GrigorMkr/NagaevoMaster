#!/usr/bin/env bash
# Усиление VPS: SSH, firewall, автообновления, WireGuard на UDP 443.
# API (443 TCP) и сайт не затрагиваются — WireGuard использует 443 UDP.
set -euo pipefail

WG_PORT="${WG_PORT:-443}"
export DEBIAN_FRONTEND=noninteractive

echo "==> Пакеты безопасности"
apt-get update -qq
apt-get install -y -qq fail2ban unattended-upgrades apt-listchanges

echo "==> SSH: только ключи"
SSHD_CFG="/etc/ssh/sshd_config"
touch "${SSHD_CFG}"
for kv in \
  "PasswordAuthentication no" \
  "KbdInteractiveAuthentication no" \
  "ChallengeResponseAuthentication no" \
  "PermitEmptyPasswords no" \
  "PubkeyAuthentication yes" \
  "MaxAuthTries 3" \
  "LoginGraceTime 30" \
  "X11Forwarding no" \
  "AllowTcpForwarding no" \
  "PermitRootLogin prohibit-password"
do
  key="${kv%% *}"
  if grep -qE "^#?${key}" "${SSHD_CFG}"; then
    sed -i -E "s/^#?${key}.*/${kv}/" "${SSHD_CFG}"
  else
    echo "${kv}" >> "${SSHD_CFG}"
  fi
done
systemctl reload sshd || systemctl reload ssh

echo "==> Fail2ban (SSH)"
cat > /etc/fail2ban/jail.local <<'JAIL'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 4
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
maxretry = 3
bantime = 24h
JAIL
systemctl enable fail2ban
systemctl restart fail2ban

echo "==> Автообновления безопасности"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'AUTO'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
AUTO
systemctl enable unattended-upgrades 2>/dev/null || true

echo "==> Sysctl hardening"
cat > /etc/sysctl.d/99-hardening.conf <<'SYS'
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.tcp_syncookies = 1
SYS
sysctl --system >/dev/null 2>&1 || true

echo "==> UFW: минимум открытых портов"
if command -v ufw >/dev/null 2>&1; then
  ufw --force disable >/dev/null 2>&1 || true
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  # Старый стандартный порт WireGuard — закрываем
  ufw delete allow 51820/udp >/dev/null 2>&1 || true
  ufw allow "${WG_PORT}/udp" comment 'WireGuard VPN (UDP)' >/dev/null 2>&1 || ufw allow "${WG_PORT}/udp"
  if grep -q 'DEFAULT_FORWARD_POLICY="DROP"' /etc/default/ufw 2>/dev/null; then
    sed -i 's/DEFAULT_FORWARD_POLICY="DROP"/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw
  fi
  ufw --force enable
  ufw status verbose || true
fi

echo "==> Nginx: скрыть версию"
if [[ -f /etc/nginx/nginx.conf ]] && ! grep -q 'server_tokens off' /etc/nginx/nginx.conf; then
  sed -i '/http {/a \    server_tokens off;' /etc/nginx/nginx.conf
  nginx -t && systemctl reload nginx
fi

echo ""
echo "==> Проверка API"
curl -fsS http://127.0.0.1:4000/api/health && echo
curl -fsS https://api.nagaevomaster.ru/api/health && echo || true

echo ""
echo "Hardening завершён. WireGuard: UDP ${WG_PORT} (переустановите клиентские конфиги: npm run vps:wireguard)"
