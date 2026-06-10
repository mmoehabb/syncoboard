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

    if (!boardMember || !boardMember.voicePeerId) {
      return apiError(API_ERRORS.FORBIDDEN);
    }

    const { voicePeerId } = boardMember;

    const signals = await prisma.$transaction(async (tx) => {
      const pendingSignals = await tx.voiceSignal.findMany({
        where: { boardId, toPeerId: voicePeerId },
        orderBy: { createdAt: "asc" },
      });

      if (pendingSignals.length > 0) {
        await tx.voiceSignal.deleteMany({
          where: {
            id: { in: pendingSignals.map((s) => s.id) },
          },
        });
      }

      return pendingSignals;
    });

    return NextResponse.json({
      signals: signals.map((s) => ({
        peerId: s.fromPeerId,
        signal: s.signal,
      })),
    });
  } catch (error) {
    console.error("Error retrieving signals:", error);
    return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
  }
}
