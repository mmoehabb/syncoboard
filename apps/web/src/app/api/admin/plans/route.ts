import { NextResponse } from "next/server";
import { prisma } from "@syncoboard/db";
import { withAdminAuth } from "@/lib/api/admin-auth";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { z } from "zod";

const createPlanSchema = z.object({
  name: z.string().min(1),
  maxWorkspaces: z.number().int().min(0).optional().default(0),
  maxBoardsPerWorkspace: z.number().int().min(0).optional().default(0),
  maxMembersPerBoard: z.number().int().min(0).optional().default(0),
  maxActiveBoards: z.number().int().min(0).optional().default(0),
  isTrial: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

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
      const parsed = createPlanSchema.safeParse(body);

      if (!parsed.success) {
        console.error("Admin create plan validation error:", parsed.error);
        return apiError(API_ERRORS.BAD_REQUEST);
      }

      const plan = await prisma.plan.create({
        data: parsed.data,
      });

      return NextResponse.json(plan);
    } catch (error) {
      console.error("Admin create plan error:", error);
      return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
    }
  });
}
