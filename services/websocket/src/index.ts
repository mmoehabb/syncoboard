import { logger } from "./logger";
import "dotenv/config";
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
        logger.error(e, "Webhook parse error:");
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
  logger.info(`Socket connected: ${socket.id}`);

  // Client requests to join a specific board room
  socket.on(WEBSOCKET_EVENTS.JOIN_BOARD, (boardId) => {
    logger.info(`Socket ${socket.id} joining board ${boardId}`);
    socket.join(encodeBoardRoomName(boardId));
  });

  // Client requests to leave a specific board room
  socket.on(WEBSOCKET_EVENTS.LEAVE_BOARD, (boardId) => {
    logger.info(`Socket ${socket.id} leaving board ${boardId}`);
    socket.leave(encodeBoardRoomName(boardId));
  });

  // Client requests to join their personal user room for notifications
  socket.on(WEBSOCKET_EVENTS.JOIN_USER, (userId) => {
    logger.info(`Socket ${socket.id} joining user ${userId}`);
    socket.join(encodeUserRoomName(userId));
  });

  // WebRTC Voice Signaling
  socket.on(WEBSOCKET_EVENTS.VOICE_JOIN, (boardId, peerId) => {
    logger.info(
      `Socket ${socket.id} (peer: ${peerId}) joining voice on board ${boardId}`,
    );
    socket.join(`voice_board_${boardId}`);
    socket.join(`voice_peer_${peerId}`);
    socket
      .to(`voice_board_${boardId}`)
      .emit(WEBSOCKET_EVENTS.VOICE_JOIN, { peerId });
  });

  socket.on(WEBSOCKET_EVENTS.VOICE_LEAVE, (boardId, peerId) => {
    logger.info(
      `Socket ${socket.id} (peer: ${peerId}) leaving voice on board ${boardId}`,
    );
    socket.leave(`voice_board_${boardId}`);
    socket.leave(`voice_peer_${peerId}`);
    socket
      .to(`voice_board_${boardId}`)
      .emit(WEBSOCKET_EVENTS.VOICE_LEAVE, { peerId });
  });

  socket.on(WEBSOCKET_EVENTS.VOICE_SIGNAL, (data) => {
    const { toPeerId, fromPeerId, signal } = data;
    socket.to(`voice_peer_${toPeerId}`).emit(WEBSOCKET_EVENTS.VOICE_SIGNAL, {
      peerId: fromPeerId,
      signal,
    });
  });

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(HTTP_PORT, () => {
  logger.info(`WebSocket service listening on port ${HTTP_PORT}`);
});
