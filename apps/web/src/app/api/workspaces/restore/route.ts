import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { hasValidSubscription } from "@/lib/api/with-subscription";

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

    if (!workspaceName) {
      return apiError(
        API_ERRORS.customBadRequest("Workspace name is required"),
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
      include: {
        members: {
          where: { userId: userId },
        },
      },
    });

    if (!workspace) {
      return apiError(API_ERRORS.customNotFound("Workspace"));
    }

    if (!workspace.isDeleted) {
      return apiError(API_ERRORS.customBadRequest("Workspace is not deleted"));
    }

    if (
      workspace.members.length === 0 ||
      workspace.members[0].role !== "ADMIN"
    ) {
      return apiError(
        API_ERRORS.customForbidden("Unauthorized to restore this workspace"),
      );
    }

    // Check user's subscription limits
    const userSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: "ACTIVE",
      },
      include: {
        price: {
          include: { plan: true },
        },
      },
    });

    if (!userSubscription) {
      return apiError(
        API_ERRORS.customForbidden(
          "Active subscription required to restore a workspace",
        ),
      );
    }

    const maxWorkspaces = userSubscription.price.plan.maxWorkspaces;

    const currentWorkspacesCount = await prisma.workspace.count({
      where: {
        isDeleted: false,
        members: {
          some: { userId: userId, role: "ADMIN" },
        },
      },
    });

    if (maxWorkspaces !== -1 && currentWorkspacesCount >= maxWorkspaces) {
      return apiError(
        API_ERRORS.customForbidden(
          `You have reached your limit of ${maxWorkspaces} active workspaces on this plan. Cannot restore.`,
        ),
      );
    }

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { isDeleted: false },
    });

    return NextResponse.json({ message: "Workspace restored successfully" });
  } catch (error) {
    console.error("Error restoring workspace:", error);
    return apiError(API_ERRORS.customInternal("Failed to restore workspace"));
  }
}
