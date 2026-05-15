import { Server } from "socket.io";
import { createServer } from "http";
import {
  WEBSOCKET_EVENTS,
  encodeBoardRoomName,
  encodeUserRoomName,
} from "@syncoboard/shared";

const HTTP_PORT = process.env.PORT || 3002;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:3000";

const httpServer = createServer((req, res) => {
  // CORS setup for webhook endpoint
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/webhook/emit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { room, event, data } = payload;

        if (!event || !data) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "event and data are required" }));
          return;
        }

        if (room) {
          io.to(room).emit(event, data);
        } else {
          io.emit(event, data);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        console.error("Webhook parse error:", e);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid JSON" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Client requests to join a specific board room
  socket.on(WEBSOCKET_EVENTS.JOIN_BOARD, (boardId) => {
    console.log(`Socket ${socket.id} joining board ${boardId}`);
    socket.join(encodeBoardRoomName(boardId));
  });

  // Client requests to leave a specific board room
  socket.on(WEBSOCKET_EVENTS.LEAVE_BOARD, (boardId) => {
    console.log(`Socket ${socket.id} leaving board ${boardId}`);
    socket.leave(encodeBoardRoomName(boardId));
  });

  // Client requests to join their personal user room for notifications
  socket.on(WEBSOCKET_EVENTS.JOIN_USER, (userId) => {
    console.log(`Socket ${socket.id} joining user ${userId}`);
    socket.join(encodeUserRoomName(userId));
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`WebSocket service listening on port ${HTTP_PORT}`);
});
