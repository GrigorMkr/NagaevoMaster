/**
 * Быстрая проверка WireGuard на VPN VPS (Aeza).
 *   node scripts/vps/check-wg-status.mjs
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'ssh2';

const host = process.env.VPS_HOST ?? '213.176.95.209';
const keyPath = join(homedir(), '.ssh', process.env.VPS_SSH_KEY_NAME ?? 'nagaevomaster_vps');

const cmd = [
  "echo '=== UPTIME ==='",
  'uptime',
  "echo '=== WG PEERS ==='",
  'wg show wg0 2>/dev/null || echo NO_WG',
  "echo '=== WG SERVICE ==='",
  'systemctl is-active wg-quick@wg0 2>/dev/null',
  'systemctl is-enabled wg-quick@wg0 2>/dev/null',
  "echo '=== IP FORWARD ==='",
  'sysctl net.ipv4.ip_forward',
  "echo '=== NAT COUNTERS ==='",
  'iptables -t nat -L POSTROUTING -n -v 2>/dev/null | head -6',
  "echo '=== LISTEN 51820 ==='",
  "ss -ulnp | grep 51820 || echo not_listening",
  "echo '=== EGRESS TEST ==='",
  'curl -sI --max-time 8 https://www.youtube.com | head -3',
  'curl -sI --max-time 8 https://ya.ru | head -2',
  "echo '=== MEM/DISK ==='",
  'free -h | head -2',
  'df -h / | tail -1',
  "echo '=== WG CONFIG PEERS ==='",
  'grep -E "^#|Address|PublicKey|AllowedIPs" /etc/wireguard/wg0.conf 2>/dev/null | head -40',
  "echo '=== WG DUMP ==='",
  'wg show wg0 dump',
  "echo '=== WG PROCESS ==='",
  "ps aux | grep -E '[w]g|[w]ireguard' | head -5",
].join('\n');

function connect() {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on('ready', () => resolve(conn))
      .on('error', reject)
      .connect({
        host,
        port: 22,
        username: process.env.VPS_USER ?? 'root',
        privateKey: readFileSync(keyPath),
        readyTimeout: 30000,
      });
  });
}

function run(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      stream.on('close', (code) => resolve(code ?? 0));
      stream.on('data', (d) => process.stdout.write(d));
      stream.stderr.on('data', (d) => process.stderr.write(d));
    });
  });
}

const conn = await connect();
const code = await run(conn, cmd);
conn.end();
process.exit(code === 0 ? 0 : 1);
