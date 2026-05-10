import { NextResponse } from "next/server";
import { prisma } from "@syncoboard/db";
import bcrypt from "bcryptjs";
import { withAdminAuth } from "@/lib/api/admin-auth";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function POST(req: Request) {
  return withAdminAuth(req, async (req, adminId) => {
    try {
      const body = await req.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return apiError(API_ERRORS.BAD_REQUEST);
      }

      // Backend validation of password strength
      const minLength = newPassword.length >= 8;
      const hasNumber = /\d/.test(newPassword);
      const hasLetter = /[a-zA-Z]/.test(newPassword);
      const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

      if (!minLength || !hasNumber || !hasLetter || !hasSymbol) {
        return apiError(
          API_ERRORS.customBadRequest(
            "Password does not meet complexity requirements.",
          ),
        );
      }

      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        return apiError(API_ERRORS.UNAUTHORIZED);
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        admin.password,
      );
      if (!isValidPassword) {
        return apiError(
          API_ERRORS.customUnauthorized("Invalid current password"),
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.admin.update({
        where: { id: adminId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Admin change password error:", error);
      return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
    }
  });
}
