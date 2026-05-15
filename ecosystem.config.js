module.exports = {
  apps: [
    {
      name: "web",
      script: "bun",
      args: "run web start",
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
      args: "run dashboard start",
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
      args: "run websocket start",
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
      args: "run cron start",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
