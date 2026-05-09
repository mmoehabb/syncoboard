import { NextResponse } from "next/server";
import { prisma } from "@syncoboard/db";
import { withAdminAuth } from "@/lib/api/admin-auth";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function GET(req: Request) {
  return withAdminAuth(req, async () => {
    try {
      const plans = await prisma.plan.findMany({
        include: {
          prices: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(plans);
    } catch (error) {
      console.error("Admin fetch plans error:", error);
      return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
    }
  });
}

export async function POST(req: Request) {
  return withAdminAuth(req, async () => {
    try {
      const body = await req.json();
      const {
        name,
        maxWorkspaces,
        maxBoardsPerWorkspace,
        maxMembersPerBoard,
        maxActiveBoards,
        isTrial,
        isActive,
      } = body;

      if (!name) {
        return apiError(API_ERRORS.BAD_REQUEST);
      }

      const plan = await prisma.plan.create({
        data: {
          name,
          maxWorkspaces: maxWorkspaces || 0,
          maxBoardsPerWorkspace: maxBoardsPerWorkspace || 0,
          maxMembersPerBoard: maxMembersPerBoard || 0,
          maxActiveBoards: maxActiveBoards || 0,
          isTrial: isTrial || false,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      return NextResponse.json(plan);
    } catch (error) {
      console.error("Admin create plan error:", error);
      return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
    }
  });
}
