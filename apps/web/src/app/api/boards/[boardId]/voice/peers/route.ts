import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function GET(
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

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

    const activePeers = await prisma.boardMember.findMany({
      where: {
        boardId,
        userId: { not: userId },
        voicePeerId: { not: null },
        lastVoicePing: { gte: thirtySecondsAgo },
      },
      select: { voicePeerId: true },
    });

    const peers = activePeers.map((p) => p.voicePeerId).filter(Boolean);

    return NextResponse.json({ peers });
  } catch (error) {
    console.error("Error retrieving peers:", error);
    return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
  }
}
