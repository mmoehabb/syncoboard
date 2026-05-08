import { NextResponse } from "next/server";
import { prisma } from "@syncoboard/db";
import { withAdminAuth } from "@/lib/api/admin-auth";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminAuth(req, async () => {
    try {
      const { id } = await params;
      const body = await req.json();

      const existingPlan = await prisma.plan.findUnique({
        where: { id },
      });

      if (!existingPlan) {
        return apiError(API_ERRORS.NOT_FOUND);
      }

      const plan = await prisma.plan.update({
        where: { id },
        data: {
          name: body.name !== undefined ? body.name : existingPlan.name,
          maxWorkspaces:
            body.maxWorkspaces !== undefined
              ? body.maxWorkspaces
              : existingPlan.maxWorkspaces,
          maxBoardsPerWorkspace:
            body.maxBoardsPerWorkspace !== undefined
              ? body.maxBoardsPerWorkspace
              : existingPlan.maxBoardsPerWorkspace,
          maxMembersPerBoard:
            body.maxMembersPerBoard !== undefined
              ? body.maxMembersPerBoard
              : existingPlan.maxMembersPerBoard,
          maxActiveBoards:
            body.maxActiveBoards !== undefined
              ? body.maxActiveBoards
              : existingPlan.maxActiveBoards,
          isTrial:
            body.isTrial !== undefined ? body.isTrial : existingPlan.isTrial,
          isActive:
            body.isActive !== undefined ? body.isActive : existingPlan.isActive,
        },
      });

      return NextResponse.json(plan);
    } catch (error) {
      console.error("Admin update plan error:", error);
      return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
    }
  });
}
