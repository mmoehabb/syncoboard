import type { ActivityType, InvitationStatus } from "@syncoboard/db";

export interface NotificationLog {
  id: string;
  boardId: string;
  type: ActivityType;
  actorId: string | null;
  targetUserId: string | null;
  taskId: string | null;
  status: InvitationStatus | null;
  createdAt: string;
  updatedAt: string;
  actor?: { name: string | null; email: string | null; image: string | null } | null;
  targetUser?: { name: string | null; email: string | null; image: string | null } | null;
  board?: { name: string; workspace: { name: string } } | null;
  task?: { title: string; status: string } | null;
}
