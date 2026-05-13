export const WEBSOCKET_EVENTS = {
  JOIN_BOARD: "join_board",
  LEAVE_BOARD: "leave_board",
  JOIN_USER: "join_user",
  TASK_UPDATED: "task_updated",
  BOARD_UPDATED: "board_updated",
  NOTIFICATION_RECEIVED: "notification_received",
} ;

export function encodeBoardRoomName(boardId: string): string {
  return `board_${boardId}`;
}

export function decodeBoardRoomName(roomName: string): string | null {
  if (roomName.startsWith("board_")) {
    return roomName.substring(6);
  }
  return null;
}

export function encodeUserRoomName(userId: string): string {
  return `user_${userId}`;
}

export function decodeUserRoomName(roomName: string): string | null {
  if (roomName.startsWith("user_")) {
    return roomName.substring(5);
  }
  return null;
}
