import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { signalStore } from "@syncoboard/shared";

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

    const signals = signalStore.consumeSignals(boardId, voicePeerId);

    return NextResponse.json({ signals });
  } catch (error) {
    console.error("Error retrieving signals:", error);
    return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
  }
}
