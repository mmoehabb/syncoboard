"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, X, Info } from "lucide-react";
import { formatRelativeOrAbsoluteDate } from "@/lib/utils/date";
import { useSocket } from "@/context/SocketContext";
import { WEBSOCKET_EVENTS } from "@syncoboard/shared";

export function NotificationsDropdown() {
  const { socket, isConnected } = useSocket();
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<unknown[]>([]);
  const [lastRead, setLastRead] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const [logsRes, readRes] = await Promise.all([
        fetch("/api/notifications"),
        fetch("/api/notifications/read"),
      ]);
      const logsData = await logsRes.json();
      const readData = await readRes.json();

      setLogs(logsData.logs || []);
      const readDate = readData.lastRead ? new Date(readData.lastRead) : null;
      setLastRead(readDate);

      if (logsData.logs) {
        const unread = logsData.logs.filter((log: {createdAt: string | Date}) => {
          if (!readDate) return true;
          return new Date(log.createdAt) > readDate;
        });
        setUnreadCount(unread.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = () => {
      fetchNotifications();
    };

    socket.on(WEBSOCKET_EVENTS.NOTIFICATION_RECEIVED, handleNewNotification);

    return () => {
      socket.off(WEBSOCKET_EVENTS.NOTIFICATION_RECEIVED, handleNewNotification);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        /* @ts-expect-error node */
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = async () => {
    const newOpen = !open;
    setOpen(newOpen);
    if (newOpen && unreadCount > 0) {
      setUnreadCount(0);
      setLastRead(new Date());
      fetch("/api/notifications/read", { method: "POST" }).catch(console.error);
    }
  };

  const handleInvite = async (logId: string, action: "ACCEPT" | "DECLINE") => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, action }),
      });
      await fetchNotifications();
      // If we accept, we should reload dashboard to show the new board
      if (action === "ACCEPT") {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5 transition-colors text-syntax-grey hover:text-white"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-obsidian-night border border-white/10 rounded-md shadow-xl z-50">
          <div className="p-3 border-b border-white/10 font-mono text-sm font-bold text-white flex justify-between items-center bg-void-grey sticky top-0">
            <span>Notifications</span>
          </div>
          <div className="flex flex-col">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-syntax-grey font-mono text-sm">
                No new notifications
              </div>
            ) : (
              (logs as {id: string, type?: string, actor?: {name?: string, email?: string}, message?: string, taskId?: string, createdAt: string | Date, read?: boolean, action?: string, targetId?: string, board?: {name?: string, workspace?: {name?: string}}, status?: string, task?: {title?: string, status?: string, workspace?: {name?: string}, board?: {name?: string}}}[]) /* eslint-disable-line no-restricted-syntax */.map((log) => {
                const isUnread = lastRead
                  ? new Date(log.createdAt) > lastRead
                  : true;
                return (
                  <div
                    key={log.id}
                    className={`p-3 border-b border-white/5 text-sm font-mono flex flex-col gap-2 ${
                      isUnread ? "bg-white/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 text-syntax-grey">
                        <Info size={14} />
                      </div>
                      <div className="flex-1">
                        {log.type === "INVITATION" && (
                          <div>
                            <span className="text-white font-semibold">
                              {log.actor?.name || log.actor?.email || "Someone"}
                            </span>{" "}
                            invited you to join{" "}
                            <span className="text-syntax-blue">
                              {log.board?.workspace?.name}/{log.board?.name}
                            </span>
                          </div>
                        )}
                        {log.type === "MEMBER_JOIN" && (
                          <div>
                            <span className="text-white font-semibold">
                              {log.actor?.name ||
                                log.actor?.email ||
                                "A new member"}
                            </span>{" "}
                            joined{" "}
                            <span className="text-syntax-blue">
                              {log.board?.workspace?.name}/{log.board?.name}
                            </span>
                          </div>
                        )}
                        {log.type === "MEMBER_LEAVE" && (
                          <div>
                            <span className="text-white font-semibold">
                              {log.actor?.name ||
                                log.actor?.email ||
                                "A member"}
                            </span>{" "}
                            left{" "}
                            <span className="text-syntax-blue">
                              {log.board?.workspace?.name}/{log.board?.name}
                            </span>
                          </div>
                        )}
                        {log.type === "TASK_UPDATE" && (
                          <div>
                            Task{" "}
                            <span className="text-white font-semibold">
                              {log.task?.title || "Unknown Task"}
                            </span>{" "}
                            was updated to{" "}
                            <span className="text-syntax-purple">
                              {log.task?.status}
                            </span>{" "}
                            in{" "}
                            <span className="text-syntax-blue">
                              {log.board?.workspace?.name}/{log.board?.name}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-syntax-grey mt-1">
                          {formatRelativeOrAbsoluteDate(
                            new Date(log.createdAt),
                          )}
                        </div>
                      </div>
                    </div>
                    {log.type === "INVITATION" && log.status === "PENDING" && (
                      <div className="flex gap-2 mt-1 ml-6">
                        <button
                          disabled={loading}
                          onClick={() => handleInvite(log.id, "ACCEPT")}
                          className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-2 py-1 rounded transition-colors"
                        >
                          <Check size={12} /> Accept
                        </button>
                        <button
                          disabled={loading}
                          onClick={() => handleInvite(log.id, "DECLINE")}
                          className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2 py-1 rounded transition-colors"
                        >
                          <X size={12} /> Decline
                        </button>
                      </div>
                    )}
                    {log.type === "INVITATION" && log.status !== "PENDING" && (
                      <div className="text-xs text-syntax-grey ml-6 italic">
                        Invitation {log.status?.toLowerCase()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
