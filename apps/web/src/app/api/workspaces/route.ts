import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { hasValidSubscription } from "@/lib/api/with-subscription";

export async function GET(req: Request) {
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
    const includeBoards = url.searchParams.get("includeBoards") === "true";

    if (includeBoards) {
      const workspaces = await prisma.workspace.findMany({
        where: {
          isDeleted: false,
          members: {
            some: { userId: userId },
          },
        },
        include: {
          boards: {
            where: { isDeleted: false },
          },
        },
      });
      return NextResponse.json({ workspaces }, { status: 200 });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        isDeleted: false,
        members: {
          some: { userId: userId },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ workspaces }, { status: 200 });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return apiError(API_ERRORS.customInternal("Failed to fetch workspaces"));
  }
}

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
    const { name } = body;

    if (!name) {
      return apiError(
        API_ERRORS.customBadRequest("Workspace name is required"),
      );
    }

    const nameRegex = /^[a-zA-Z0-9-_]+$/;
    if (!nameRegex.test(name)) {
      return apiError(
        API_ERRORS.customBadRequest(
          "Workspace name can only contain letters, numbers, hyphens, and underscores. No spaces or special characters are allowed.",
        ),
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
          "Active subscription required to create a workspace",
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
          `You have reached your limit of ${maxWorkspaces} workspaces on this plan.`,
        ),
      );
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
      },
    });

    // Add user as admin of the newly created workspace
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: userId,
        role: "ADMIN",
      },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return apiError(API_ERRORS.customInternal("Failed to create workspace"));
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

    if (!workspaceName) {
      return apiError(
        API_ERRORS.customBadRequest("Workspace name is required"),
      );
    }

    // Find the workspace that the user is a member of with the given name
    const workspace = await prisma.workspace.findFirst({
      where: {
        name: { equals: workspaceName, mode: "insensitive" },
        isDeleted: false,
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

    if (
      workspace.members.length === 0 ||
      workspace.members[0].role !== "ADMIN"
    ) {
      return apiError(
        API_ERRORS.customForbidden("Unauthorized to delete this workspace"),
      );
    }

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return apiError(API_ERRORS.customInternal("Failed to delete workspace"));
  }
}
