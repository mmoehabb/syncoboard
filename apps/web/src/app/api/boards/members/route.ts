import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { hasValidSubscription } from "@/lib/api/with-subscription";
import { emitWebSocketEvent } from "@/lib/api/websocket";
import {
  WEBSOCKET_EVENTS,
  encodeUserRoomName,
  encodeBoardRoomName,
} from "@syncoboard/shared";

export async function POST(req: Request) {
  const userId = await getSessionOrPat();

  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  const isValidSubscription = await hasValidSubscription(userId);
  if (!isValidSubscription) {
    return apiError(API_ERRORS.customForbidden("Active subscription required"));
  }

  try {
    const body = await req.json();
    const { workspaceName, boardName, identifier } = body;

    if (!workspaceName || !boardName || !identifier) {
      return apiError(
        API_ERRORS.customBadRequest(
          "Workspace name, board name, and user identifier are required",
        ),
      );
    }

    // Find the workspace that the user is a member of
    const workspace = await prisma.workspace.findFirst({
      where: {
        name: workspaceName,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!workspace) {
      return apiError(API_ERRORS.customNotFound("Workspace"));
    }

    // Find the board that the user is a member of, or they are an admin of the workspace
    const board = await prisma.board.findFirst({
      where: {
        workspaceId: workspace.id,
        name: boardName,
        OR: [
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
          {
            workspace: {
              members: {
                some: {
                  userId: userId,
                  role: "ADMIN",
                },
              },
            },
          },
        ],
      },
    });

    if (!board) {
      return apiError(API_ERRORS.customNotFound("Board"));
    }

    // Check if the requesting user is an ADMIN of the board or workspace
    const boardMemberReq = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId: userId,
        },
      },
    });

    const workspaceMemberReq = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: userId,
        },
      },
    });

    if (
      boardMemberReq?.role !== "ADMIN" &&
      workspaceMemberReq?.role !== "ADMIN"
    ) {
      return apiError(
        API_ERRORS.customForbidden(
          "Unauthorized to invite members to this board",
        ),
      );
    }

    // Find the target user by ID or email
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { email: identifier }],
      },
    });

    if (!targetUser) {
      return apiError(API_ERRORS.customNotFound("User"));
    }

    // Check if already a member
    const existingMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return apiError(
        API_ERRORS.customBadRequest("User is already a member of this board"),
      );
    }

    // Instead of instantly adding them, create an invitation log
    // First verify they don't already have a pending invite
    const existingInvite = await prisma.boardActivityLog.findFirst({
      where: {
        boardId: board.id,
        type: "INVITATION",
        targetUserId: targetUser.id,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      return apiError(
        API_ERRORS.customBadRequest(
          "User already has a pending invitation to this board",
        ),
      );
    }

    const invitationLog = await prisma.boardActivityLog.create({
      data: {
        boardId: board.id,
        type: "INVITATION",
        actorId: userId,
        targetUserId: targetUser.id,
        status: "PENDING",
      },
    });

    // Notify the user
    await emitWebSocketEvent(
      encodeUserRoomName(targetUser.id),
      WEBSOCKET_EVENTS.NOTIFICATION_RECEIVED,
      {
        logId: invitationLog.id,
      },
    );

    return NextResponse.json(
      {
        invitation: {
          id: invitationLog.id,
          boardId: invitationLog.boardId,
          targetUserId: invitationLog.targetUserId,
          status: invitationLog.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error adding member to board:", error);
    return apiError(
      API_ERRORS.customInternal("Failed to invite member to board"),
    );
  }
}

export async function DELETE(req: Request) {
  const userId = await getSessionOrPat();

  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  const isValidSubscription = await hasValidSubscription(userId);
  if (!isValidSubscription) {
    return apiError(API_ERRORS.customForbidden("Active subscription required"));
  }

  try {
    const url = new URL(req.url);
    const workspaceName = url.searchParams.get("workspace");
    const boardName = url.searchParams.get("board");
    const identifier = url.searchParams.get("identifier");

    if (!workspaceName || !boardName || !identifier) {
      return apiError(
        API_ERRORS.customBadRequest(
          "Workspace name, board name, and user identifier are required",
        ),
      );
    }

    // Find the workspace that the user is a member of
    const workspace = await prisma.workspace.findFirst({
      where: {
        name: workspaceName,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!workspace) {
      return apiError(API_ERRORS.customNotFound("Workspace"));
    }

    // Find the board that the user is a member of, or they are an admin of the workspace
    const board = await prisma.board.findFirst({
      where: {
        workspaceId: workspace.id,
        name: boardName,
        OR: [
          {
            members: {
              some: {
                userId: userId,
              },
            },
          },
          {
            workspace: {
              members: {
                some: {
                  userId: userId,
                  role: "ADMIN",
                },
              },
            },
          },
        ],
      },
    });

    if (!board) {
      return apiError(API_ERRORS.customNotFound("Board"));
    }

    // Check if the requesting user is an ADMIN of the board or workspace
    const boardMemberReq = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId: userId,
        },
      },
    });

    const workspaceMemberReq = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: userId,
        },
      },
    });

    if (
      boardMemberReq?.role !== "ADMIN" &&
      workspaceMemberReq?.role !== "ADMIN"
    ) {
      return apiError(
        API_ERRORS.customForbidden(
          "Unauthorized to remove members from this board",
        ),
      );
    }

    // Find the target user by ID or email
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { email: identifier }],
      },
    });

    if (!targetUser) {
      return apiError(API_ERRORS.customNotFound("User"));
    }

    // Remove the user
    await prisma.boardMember.delete({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId: targetUser.id,
        },
      },
    });

    // Emit event
    await emitWebSocketEvent(
      encodeBoardRoomName(board.id),
      WEBSOCKET_EVENTS.BOARD_UPDATED,
      {
        boardId: board.id,
      },
    );

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error: unknown) {
    // If the record didn't exist in the first place, Prisma throws P2025
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return apiError(
        API_ERRORS.custom404("User is not a member of this board"),
      );
    }
    console.error("Error removing member from board:", error);
    return apiError(
      API_ERRORS.customInternal("Failed to remove member from board"),
    );
  }
}
