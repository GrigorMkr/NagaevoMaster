/**
 * Общие параметры Keenetic (локальная сеть).
 */
export function keeneticEnv() {
  return {
    host: process.env.KEENETIC_HOST ?? '192.168.1.1',
    login: process.env.KEENETIC_LOGIN ?? 'admin',
    password: process.env.KEENETIC_PASSWORD,
    wgName: process.env.KEENETIC_WG_NAME ?? 'Wireguard0',
    sshPort: Number(process.env.KEENETIC_SSH_PORT ?? 22),
  };
}

export function requirePassword(env = keeneticEnv()) {
  if (!env.password) {
    console.error('Укажите KEENETIC_PASSWORD (пароль администратора роутера).');
    process.exit(1);
  }
  return env.password;
}
