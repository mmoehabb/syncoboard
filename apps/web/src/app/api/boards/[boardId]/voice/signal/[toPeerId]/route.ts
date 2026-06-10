import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string; toPeerId: string }> },
) {
  const userId = await getSessionOrPat();
  if (!userId) return apiError(API_ERRORS.UNAUTHORIZED);

  const { boardId, toPeerId } = await params;
  try {
    const body = await req.json();
    const { type, data } = body;
    if (!type || !data)
      return apiError(
        API_ERRORS.customBadRequest("type and data are required"),
      );

    const boardMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!boardMember || !boardMember.voicePeerId) {
      return apiError(API_ERRORS.FORBIDDEN);
    }

    const targetPeer = await prisma.boardMember.findFirst({
      where: { boardId, voicePeerId: toPeerId },
    });

    if (!targetPeer) {
      return apiError(API_ERRORS.customNotFound("Target peer not found"));
    }

    await prisma.voiceSignal.create({
      data: {
        boardId,
        fromPeerId: boardMember.voicePeerId,
        toPeerId,
        signal: { type, data },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending signal:", error);
    return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
  }
}
