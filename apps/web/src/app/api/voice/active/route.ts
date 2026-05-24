import { NextResponse } from "next/server";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { getActiveVoicePeers } from "@/lib/actions/voice";
import { serializeBigInt } from "@syncoboard/shared";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const boardId = url.searchParams.get("boardId");

    if (!boardId) {
      return apiError(API_ERRORS.customBadRequest("boardId is required"));
    }

    const peers = await getActiveVoicePeers(boardId);
    return NextResponse.json(serializeBigInt({ peers }), { status: 200 });
  } catch (error: any) {
    console.error("Error getting active peers:", error);
    if (error.message === "Unauthorized") {
      return apiError(API_ERRORS.UNAUTHORIZED);
    }
    return apiError(API_ERRORS.customInternal("Failed to get active peers"));
  }
}
