import { serve } from "bun";
import { handleGithubWebhook } from "./handlers/github";
import { handlePaypalWebhook } from "./handlers/paypal";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4002;

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/github/hook") {
      return handleGithubWebhook(req);
    }

    if (req.method === "POST" && url.pathname === "/paypal/hook") {
      return handlePaypalWebhook(req);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
});

console.log(`[Webhook Service] Listening on port ${server.port}`);
