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
    const body = await req.json();
    const { peerId } = body;
    if (!peerId)
      return apiError(API_ERRORS.customBadRequest("peerId is required"));

    const boardMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!boardMember) {
      return apiError(API_ERRORS.FORBIDDEN);
    }

    await prisma.boardMember.update({
      where: { boardId_userId: { boardId, userId } },
      data: { voicePeerId: peerId, lastVoicePing: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error joining voice call:", error);
    return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
  }
}
