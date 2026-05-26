import { NextResponse } from "next/server";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { joinVoiceCall } from "@/lib/actions/voice";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { boardId, peerId } = body;

    if (!boardId || !peerId) {
      return apiError(
        API_ERRORS.customBadRequest("boardId and peerId are required"),
      );
    }

    await joinVoiceCall(boardId, peerId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error joining voice call:", error);
    if (error.message === "Unauthorized") {
      return apiError(API_ERRORS.UNAUTHORIZED);
    }
    return apiError(
      API_ERRORS.customInternal(error.message || "Failed to join voice call"),
    );
  }
}
