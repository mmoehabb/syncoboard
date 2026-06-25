import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api/admin-auth";

export async function GET(req: Request) {
  return withAdminAuth(req, async (_req, _adminId) => {
    return NextResponse.json({ authenticated: true });
  });
}
