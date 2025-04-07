module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'src/server/index.js',
      env: {
        NODE_ENV: 'production',
        SERVER_PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'frontend',
      script: 'npx',
      args: 'serve -s build -l 3001',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
}; 