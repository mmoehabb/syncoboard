import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { hasValidSubscription } from "@/lib/api/with-subscription";
import {
  FREE_MAX_ACTIVE_BOARDS,
  FREE_MAX_BOARDS_PER_WORKSPACE,
} from "@/lib/constants";

export async function PUT(req: Request) {
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

    if (!workspaceName || !boardName) {
      return apiError(
        API_ERRORS.customBadRequest(
          "Workspace name and Board name are required",
        ),
      );
    }

    // Find the workspace that the user is a member of with the given name
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

    // Find the board in this workspace
    const board = await prisma.board.findFirst({
      where: {
        workspaceId: workspace.id,
        name: boardName,
      },
    });

    if (!board) {
      return apiError(API_ERRORS.customNotFound("Board"));
    }

    if (!board.isDeleted) {
      return apiError(API_ERRORS.customBadRequest("Board is not deleted"));
    }

    // Check if user is an ADMIN of the board or workspace
    const boardMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId: userId,
        },
      },
    });

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: userId,
        },
      },
    });

    if (boardMember?.role !== "ADMIN" && workspaceMember?.role !== "ADMIN") {
      return apiError(
        API_ERRORS.customForbidden("Unauthorized to restore this board"),
      );
    }

    let isBoardActive = true;
    if (!workspace.isActive) {
      isBoardActive = false;
    } else {
      const userSubscription = await prisma.subscription.findFirst({
        where: {
          userId: userId,
          status: "ACTIVE",
          currentPeriodEnd: { gt: new Date() },
        },
        include: {
          price: {
            include: { plan: true },
          },
        },
      });

      let maxActiveBoards = FREE_MAX_ACTIVE_BOARDS;
      let maxBoardsPerWorkspace = FREE_MAX_BOARDS_PER_WORKSPACE;

      if (userSubscription?.price?.plan) {
        maxActiveBoards = userSubscription.price.plan.maxActiveBoards;
        maxBoardsPerWorkspace =
          userSubscription.price.plan.maxBoardsPerWorkspace;
      } else {
        const freePlan = await prisma.plan.findFirst({
          where: { name: "Free" },
        });
        if (freePlan) {
          maxActiveBoards = freePlan.maxActiveBoards;
          maxBoardsPerWorkspace = freePlan.maxBoardsPerWorkspace;
        }
      }

      if (maxActiveBoards > 0 || maxBoardsPerWorkspace > 0) {
        // Count active boards overall
        const activeBoardsCount = await prisma.board.count({
          where: {
            isDeleted: false,
            isActive: true,
            members: {
              some: { userId: userId, role: "ADMIN" },
            },
          },
        });

        // Count active boards in this workspace
        const activeWorkspaceBoardsCount = await prisma.board.count({
          where: {
            workspaceId: workspace.id,
            isDeleted: false,
            isActive: true,
            members: {
              some: { userId: userId, role: "ADMIN" },
            },
          },
        });

        if (
          (maxActiveBoards > 0 && activeBoardsCount >= maxActiveBoards) ||
          (maxBoardsPerWorkspace > 0 &&
            activeWorkspaceBoardsCount >= maxBoardsPerWorkspace)
        ) {
          isBoardActive = false;
        }
      }
    }

    await prisma.board.update({
      where: { id: board.id },
      data: { isDeleted: false, isActive: isBoardActive },
    });

    return NextResponse.json({ message: "Board restored successfully" });
  } catch (error) {
    console.error("Error restoring board:", error);
    return apiError(API_ERRORS.customInternal("Failed to restore board"));
  }
}
