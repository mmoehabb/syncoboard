"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { WEBSOCKET_EVENTS } from "@syncoboard/shared";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // Only connect if the user is authenticated
    if (!session?.user?.id) return;

    // We assume the websocket service runs on port 3002 locally
    const socketInstance = io(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3002",
      {
        transports: ["websocket"],
        reconnectionAttempts: 5,
      },
    );

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      // Join a personal room for targeted notifications
      socketInstance.emit(WEBSOCKET_EVENTS.JOIN_USER, session.user?.id);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [session?.user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
