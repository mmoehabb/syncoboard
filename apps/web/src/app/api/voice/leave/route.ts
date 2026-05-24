import { NextResponse } from "next/server";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { leaveVoiceCall } from "@/lib/actions/voice";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { boardId } = body;

    if (!boardId) {
      return apiError(API_ERRORS.customBadRequest("boardId is required"));
    }

    await leaveVoiceCall(boardId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error leaving voice call:", error);
    if (error.message === "Unauthorized") {
      return apiError(API_ERRORS.UNAUTHORIZED);
    }
    return apiError(API_ERRORS.customInternal("Failed to leave voice call"));
  }
}
