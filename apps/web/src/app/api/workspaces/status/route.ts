import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { hasValidSubscription } from "@/lib/api/with-subscription";
import { FREE_MAX_WORKSPACES } from "@/lib/constants";

let cachedFreePlanMaxWorkspaces: number | null = null;

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
    const body = await req.json();
    const { workspaceName, isActive } = body;

    if (!workspaceName || isActive === undefined) {
      return apiError(
        API_ERRORS.customBadRequest(
          "Workspace name and isActive status are required",
        ),
      );
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        name: { equals: workspaceName, mode: "insensitive" },
        members: {
          some: {
            userId: userId,
            role: "ADMIN",
          },
        },
      },
    });

    if (!workspace) {
      return apiError(API_ERRORS.customNotFound("Workspace"));
    }

    if (isActive) {
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

      let maxWorkspaces = FREE_MAX_WORKSPACES;

      if (userSubscription?.price?.plan) {
        maxWorkspaces = userSubscription.price.plan.maxWorkspaces;
      } else {
        if (cachedFreePlanMaxWorkspaces === null) {
          const freePlan = await prisma.plan.findFirst({
            where: { name: "Free" },
          });
          if (freePlan) {
            cachedFreePlanMaxWorkspaces = freePlan.maxWorkspaces;
          }
        }
        if (cachedFreePlanMaxWorkspaces !== null) {
          maxWorkspaces = cachedFreePlanMaxWorkspaces;
        }
      }

      if (maxWorkspaces > 0) {
        const activeWorkspacesCount = await prisma.workspace.count({
          where: {
            isDeleted: false,
            isActive: true,
            members: {
              some: { userId: userId, role: "ADMIN" },
            },
          },
        });

        if (activeWorkspacesCount >= maxWorkspaces) {
          return apiError(
            API_ERRORS.customForbidden(
              `You have reached your limit of ${maxWorkspaces} active workspaces on this plan.`,
            ),
          );
        }
      }
    }

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { isActive },
    });

    if (!isActive) {
      // Deactivate all inner boards when workspace is deactivated
      await prisma.board.updateMany({
        where: { workspaceId: workspace.id },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      message: "Workspace status updated successfully",
      isActive,
    });
  } catch (error) {
    console.error("Error updating workspace status:", error);
    return apiError(
      API_ERRORS.customInternal("Failed to update workspace status"),
    );
  }
}
