const path = require('node:path');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'backend');

module.exports = {
  apps: [
    {
      name: 'nagaevomaster-api',
      cwd: backend,
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
