import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(API_ERRORS.UNAUTHORIZED);
    }

    const now = new Date();
    const utcDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds(),
      ),
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastOnline: utcDate,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update lastOnline:", error);
    return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
  }
}
