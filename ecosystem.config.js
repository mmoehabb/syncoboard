module.exports = {
  apps: [
    {
      name: "web",
      script: "bun",
      args: "run start:web",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "dashboard",
      script: "bun",
      args: "run start:dashboard",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "websocket",
      script: "bun",
      args: "run start:websocket",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "cron",
      script: "bun",
      args: "run start:cron",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
