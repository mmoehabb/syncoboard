import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const userId = await getSessionOrPat();
  if (!userId) return apiError(API_ERRORS.UNAUTHORIZED);

  const { boardId } = await params;
  try {
    const boardMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!boardMember) {
      return apiError(API_ERRORS.FORBIDDEN);
    }

    await prisma.boardMember.update({
      where: { boardId_userId: { boardId, userId } },
      data: { voicePeerId: null, lastVoicePing: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving voice call:", error);
    return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
  }
}
