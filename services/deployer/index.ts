import { serve } from "bun";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4001;
const DEPLOYER_SECRET = process.env.DEPLOYER_SECRET;
if (!DEPLOYER_SECRET) {
  console.error(
    "[Deployer] FATAL: DEPLOYER_SECRET is not set. Exiting to prevent unauthorized access.",
  );
  process.exit(1);
}

// Rate limiting state
let lastDeployTime = 0;
const RATE_LIMIT_MS = 60 * 1000; // 1 minute

// Deployment state
let isDeploying = false;
let pendingDeployment = false;

async function getEcosystemApps(): Promise<string[]> {
  try {
    // Navigate to root to read ecosystem config
    const rootDir = path.resolve(__dirname, "../..");
    const configPath = path.join(rootDir, "ecosystem.config.js");
    const config = require(configPath);
    if (config && config.apps && Array.isArray(config.apps)) {
      return config.apps
        .map((app: any) => app.name)
        .filter(
          (name: string) =>
            name !== "deployer" && name !== "maintenance" && name !== "webhook",
        );
    }
  } catch (error) {
    console.error("Failed to load ecosystem.config.js", error);
  }
  return ["web", "dashboard", "websocket", "cron"]; // fallback
}

async function runDeployment() {
  const rootDir = path.resolve(__dirname, "../..");

  // CRUCIAL FIX: Explicitly pass the parent environment and set INIT_CWD
  // This prevents Next.js and Bun workspaces from losing path context in the subshell.
  const execOpts = {
    cwd: rootDir,
    env: {
      ...process.env,
      INIT_CWD: rootDir,
      NODE_ENV: "production",
    },
  };

  try {
    console.log("[Deployer] Starting deployment process...");

    // 1. Get apps to stop
    const appsToManage = await getEcosystemApps();
    const appsList = appsToManage.join(" ");

    // Save current commit hash in case we need to rollback
    console.log("[Deployer] Saving current commit hash...");
    const { stdout: commitHashOutput } = await execAsync(
      "git rev-parse HEAD",
      execOpts,
    );
    const currentCommit = commitHashOutput.trim();
    console.log(`[Deployer] Current commit: ${currentCommit}`);

    // Stop PM2 services except deployer and maintenance
    console.log(`[Deployer] Stopping PM2 services: ${appsList}`);
    try {
      await execAsync(`bunx pm2 stop ${appsList}`, execOpts);
    } catch (e) {
      console.log(
        `[Deployer] Warning: Failed to stop pm2 services. Maybe they are not running?`,
      );
    }

    // Start maintenance app
    console.log(`[Deployer] Starting maintenance app...`);
    try {
      await execAsync(
        `bunx pm2 start ecosystem.config.js --only maintenance`,
        execOpts,
      );
    } catch (e) {
      console.log(`[Deployer] Warning: Failed to start maintenance app.`);
    }

    try {
      // Pull latest from main
      console.log("[Deployer] Pulling latest code from origin/main...");
      await execAsync("git restore .", execOpts);
      await execAsync("git pull origin main", execOpts);

      // Install dependencies
      console.log("[Deployer] Installing dependencies...");
      await execAsync("bun install", execOpts);

      // Clean and build
      console.log("[Deployer] Running clean and build...");
      await execAsync("bun run clean", execOpts);
      await execAsync("bun run db migrate:deploy", execOpts);
      await execAsync("bun run build:low-spec", execOpts);

      console.log("[Deployer] Build successful!");
    } catch (buildError) {
      console.error("[Deployer] Build failed! Rolling back...", buildError);

      // Rollback
      console.log(`[Deployer] Resetting to previous commit: ${currentCommit}`);
      await execAsync(`git reset --hard ${currentCommit}`, execOpts);

      // Install dependencies for the previous commit
      console.log("[Deployer] Installing dependencies for rollback...");
      await execAsync("bun install", execOpts);

      console.log(
        "[Deployer] Re-running clean and build for previous commit...",
      );
      await execAsync("bun run clean", execOpts);
      await execAsync("bun run db migrate:deploy", execOpts);
      await execAsync("bun run build:low-spec", execOpts);

      console.log("[Deployer] Rollback build successful.");
    }

    // Stop maintenance app
    console.log(`[Deployer] Stopping maintenance app...`);
    try {
      await execAsync(`bunx pm2 stop maintenance`, execOpts);
    } catch (e) {
      console.log(`[Deployer] Warning: Failed to stop maintenance app.`);
    }

    // Restart PM2 services
    console.log(`[Deployer] Restarting PM2 services: ${appsList}`);
    try {
      await execAsync(`bunx pm2 restart ${appsList}`, execOpts);
    } catch (e) {
      console.log(
        `[Deployer] Warning: pm2 restart failed, trying pm2 start...`,
      );
      await execAsync(
        `bunx pm2 start ecosystem.config.js --only ${appsList.replace(/ /g, ",")}`,
        execOpts,
      );
    }

    console.log("[Deployer] Deployment process completed successfully!");
  } catch (error) {
    console.error(
      "[Deployer] Unexpected error during deployment process:",
      error,
    );
  }
}

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/deploy") {
      // 1. Authentication
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || authHeader !== `Bearer ${DEPLOYER_SECRET}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // 2. Rate Limiting
      const now = Date.now();
      if (now - lastDeployTime < RATE_LIMIT_MS) {
        return new Response(
          JSON.stringify({
            error:
              "Rate limit exceeded. Please wait 1 minute between requests.",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // 3. Queue / Concurrency Check
      if (isDeploying) {
        if (pendingDeployment) {
          return new Response(
            JSON.stringify({
              message:
                "A deployment is already running and one is queued. Request ignored.",
            }),
            {
              status: 202,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        lastDeployTime = now; // Update rate limit for the queued request too
        pendingDeployment = true;
        return new Response(
          JSON.stringify({
            message:
              "A deployment is currently running. Your deployment has been queued.",
          }),
          {
            status: 202,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // 4. Accept Request
      lastDeployTime = now;
      isDeploying = true;

      // Start deployment asynchronously, processing queued deployments when done
      const executeDeploymentLoop = async () => {
        do {
          pendingDeployment = false; // Reset the queue flag for the current run
          await runDeployment().catch((err) => {
            console.error("Unhandled error in deployment promise:", err);
          });
        } while (pendingDeployment); // If a new one got queued during the run, loop again
        isDeploying = false; // Important: Clear deploying state only when loop finishes
      };

      executeDeploymentLoop();

      return new Response(
        JSON.stringify({ message: "Deployment accepted and started." }),
        {
          status: 202,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
});

console.log(`[Deployer] Service listening on port ${PORT}`);
