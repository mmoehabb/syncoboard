import { serve } from "bun";
import { handleGithubWebhook } from "./handlers/github";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4002;

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/github/hook") {
      return handleGithubWebhook(req);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
});

console.log(`[Webhook Service] Listening on port ${server.port}`);
