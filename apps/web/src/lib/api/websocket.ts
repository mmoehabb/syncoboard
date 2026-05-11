export async function emitWebSocketEvent(
  room: string,
  event: string,
  data: any,
) {
  try {
    const webhookUrl =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3002";
    await fetch(`${webhookUrl}/webhook/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room, event, data }),
    });
  } catch (error) {
    console.error("Failed to emit websocket event:", error);
  }
}
