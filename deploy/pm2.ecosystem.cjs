module.exports = {
  apps: [
    {
      name: 'nagaevomaster-api',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
}
