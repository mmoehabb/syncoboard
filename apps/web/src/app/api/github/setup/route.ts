import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function GET(request: Request) {
  const userId = await getSessionOrPat();

  if (!userId) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_API_URL),
    );
  }

  const { searchParams } = new URL(request.url);
  const installationId = searchParams.get("installation_id");

  if (!installationId) {
    return apiError(
      API_ERRORS.customBadRequest("Missing installation_id parameter"),
    );
  }

  try {
    // Validate that the user actually has access to this installation_id
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: "github",
      },
    });

    if (!account?.access_token) {
      return apiError(API_ERRORS.custom404("No GitHub account linked"));
    }

    const validationResponse = await fetch(
      "https://api.github.com/user/installations",
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!validationResponse.ok) {
      throw new Error("Failed to validate installations");
    }

    const data = await validationResponse.json();
    const userInstallations = data.installations || [];
    const hasAccess = userInstallations.some(
      (inst: { id: number | string }) => inst.id.toString() === installationId,
    );

    if (!hasAccess) {
      return apiError(
        API_ERRORS.customForbidden("Unauthorized access to this installation"),
      );
    }

    // Find the user's first workspace (which should be their default workspace)
    const userWorkspace = await prisma.workspaceMember.findFirst({
      where: {
        userId: userId,
      },
      include: {
        workspace: true,
      },
      orderBy: {
        createdAt: "asc", // Get the earliest created one
      },
    });

    if (!userWorkspace) {
      return NextResponse.redirect(
        new URL("/dashboard", process.env.NEXT_PUBLIC_API_URL),
      );
    }

    if (userWorkspace) {
      // Save the installation ID to this workspace
      await prisma.workspace.update({
        where: {
          id: userWorkspace.workspace.id,
        },
        data: {
          githubInstallationId: installationId,
        },
      });
    }

    // Redirect the user to the dashboard
    return NextResponse.redirect(
      new URL("/dashboard", process.env.NEXT_PUBLIC_API_URL),
    );
  } catch (error) {
    console.error(
      "Error updating workspace with GitHub App installation:",
      error,
    );
    return apiError(
      API_ERRORS.customInternal("Failed to save installation ID"),
    );
  }
}
