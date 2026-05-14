import { NextResponse } from "next/server";
import { prisma, Prisma } from "@syncoboard/db";
import { withAdminAuth } from "@/lib/api/admin-auth";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function GET(req: Request) {
  return withAdminAuth(req, async () => {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get("page") || "1", 10);
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const search = url.searchParams.get("search") || "";

      const skip = (page - 1) * limit;

      const where: Prisma.BugReportWhereInput = search
        ? {
            OR: [
              { message: { contains: search, mode: "insensitive" } },
              { stack: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [reports, total] = await Promise.all([
        prisma.bugReport.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.bugReport.count({ where }),
      ]);

      return NextResponse.json({
        data: reports,
        total,
        page,
        limit,
      });
    } catch (error) {
      console.error("Admin fetch reports error:", error);
      return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
    }
  });
}
