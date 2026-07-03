/**
 * Telnet → exec sh на Keenetic (Entware shell).
 */
import net from 'node:net';
import { keeneticEnv, requirePassword } from './lib.mjs';

function stripTelnet(s) {
  return s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').replace(/\x00/g, '');
}

export async function telnetExecSh(commands, {
  host = keeneticEnv().host,
  port = 23,
  login = keeneticEnv().login,
  password = requirePassword(),
  entwareUser = process.env.KEENETIC_ENTWARE_USER ?? 'root',
  entwarePassword = process.env.KEENETIC_ENTWARE_PASSWORD ?? 'keenetic',
  timeoutMs = 300000,
} = {}) {
  const cmdList = Array.isArray(commands) ? commands : [commands];
  const script = [
    'export PATH=/opt/sbin:/opt/bin:/opt/usr/sbin:/opt/usr/bin:$PATH',
    'export HOME=/opt/root',
    ...cmdList,
    'echo __NFQWS_DONE__',
  ].join('\n');

  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    let buf = '';
    let stage = 'banner';
    let sentLogin = false;
    let sentPass = false;
    let sentEntLogin = false;
    let sentEntPass = false;
    let sentExec = false;
    let sentScript = false;
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new Error(`Telnet timeout (${timeoutMs}ms). Buffer:\n${buf.slice(-800)}`));
    }, timeoutMs);

    const write = (s) => { sock.write(s); };

    sock.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      const tail = stripTelnet(buf.slice(-500));

      if (stage === 'banner' && /[Ll]ogin:|login:/.test(tail) && !sentLogin) {
        sentLogin = true;
        write(`${login}\r\n`);
        stage = 'password';
        return;
      }
      if (stage === 'password' && /[Pp]assword:/.test(tail) && !sentPass) {
        sentPass = true;
        write(`${password}\r\n`);
        stage = 'cli';
        return;
      }
      if (stage === 'cli' && /\(config\)>|\(config\) >/.test(tail) && !sentExec) {
        sentExec = true;
        write('exec sh\r\n');
        stage = 'entware_login';
        return;
      }
      if (stage === 'entware_login' && /[Ll]ogin:|login:/.test(tail) && sentExec && !sentEntLogin) {
        sentEntLogin = true;
        write(`${entwareUser}\r\n`);
        stage = 'entware_password';
        return;
      }
      if (stage === 'entware_password' && /[Pp]assword:/.test(tail) && sentEntLogin && !sentEntPass) {
        sentEntPass = true;
        write(`${entwarePassword}\r\n`);
        stage = 'shell';
        return;
      }
      if (stage === 'shell' && (/# $|~ # |\/ # /.test(tail) || /BusyBox/.test(buf)) && !sentScript) {
        sentScript = true;
        write(`${script}\nexit\n`);
        stage = 'wait_done';
        return;
      }
      if (stage === 'wait_done' && buf.includes('__NFQWS_DONE__')) {
        clearTimeout(timer);
        sock.end();
        const out = buf.split('__NFQWS_DONE__')[0];
        resolve({ stdout: out, code: 0 });
      }
    });

    sock.on('error', (e) => { clearTimeout(timer); reject(e); });
    sock.on('close', () => {
      if (stage === 'wait_done' && buf.includes('__NFQWS_DONE__')) return;
      if (stage !== 'wait_done') {
        clearTimeout(timer);
        reject(new Error(`Telnet closed early (${stage}).\n${buf.slice(-1000)}`));
      }
    });

    sock.connect(port, host);
  });
}

export async function telnetCli(commands, opts = {}) {
  const cmdList = Array.isArray(commands) ? commands : [commands];
  const host = opts.host ?? keeneticEnv().host;
  const port = opts.port ?? 23;
  const login = opts.login ?? keeneticEnv().login;
  const password = opts.password ?? requirePassword();

  return new Promise((resolve, reject) => {
    const sock = new net.Socket();
    let buf = '';
    let stage = 'banner';
    let sentLogin = false;
    let sentPass = false;
    let sentCmds = false;
    const timer = setTimeout(() => { sock.destroy(); reject(new Error('CLI timeout')); }, opts.timeoutMs ?? 120000);

    sock.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      const tail = buf.slice(-300);
      if (stage === 'banner' && /login:/i.test(tail) && !sentLogin) {
        sentLogin = true;
        sock.write(`${login}\r\n`);
        stage = 'password';
      } else if (stage === 'password' && /password:/i.test(tail) && !sentPass) {
        sentPass = true;
        sock.write(`${password}\r\n`);
        stage = 'cli';
      } else if (stage === 'cli' && /\(config\)>/i.test(tail) && !sentCmds) {
        sentCmds = true;
        for (const c of cmdList) sock.write(`${c}\r\n`);
        sock.write('system configuration save\r\n');
        sock.write('exit\r\n');
        setTimeout(() => { clearTimeout(timer); sock.end(); resolve({ stdout: buf }); }, 2000);
      }
    });
    sock.on('error', reject);
    sock.connect(port, host);
  });
}
