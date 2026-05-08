import { NextResponse } from "next/server";
import { prisma } from "@syncoboard/db";
import { withAdminAuth } from "@/lib/api/admin-auth";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function GET(req: Request) {
  return withAdminAuth(req, async () => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          _count: {
            select: {
              workspaceMembers: true,
              boardMembers: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedUsers = users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        workspaceCount: user._count.workspaceMembers,
        boardCount: user._count.boardMembers,
      }));

      return NextResponse.json(formattedUsers);
    } catch (error) {
      console.error("Admin fetch users error:", error);
      return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
    }
  });
}
