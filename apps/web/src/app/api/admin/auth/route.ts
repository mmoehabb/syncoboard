import { NextResponse } from "next/server";
import { prisma } from "@syncoboard/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return apiError(API_ERRORS.BAD_REQUEST);
    }

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return apiError(API_ERRORS.UNAUTHORIZED);
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return apiError(API_ERRORS.UNAUTHORIZED);
    }

    // Generate access token
    const token = crypto.randomBytes(32).toString("hex");

    // Save token to admin
    await prisma.admin.update({
      where: { id: admin.id },
      data: { accessToken: token },
    });

    return NextResponse.json({ accessToken: token });
  } catch (error) {
    console.error("Admin login error:", error);
    return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
  }
}
