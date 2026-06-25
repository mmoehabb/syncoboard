import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { cookies } from "next/headers";

export async function withAdminAuth(
  req: Request,
  handler: (req: Request, adminId: string) => Promise<Response>,
) {
  let token: string | undefined;

  // Check HttpOnly cookie first
  const cookieStore = await cookies();
  const adminTokenCookie = cookieStore.get("adminToken");

  if (adminTokenCookie?.value) {
    token = adminTokenCookie.value;
  } else {
    // Fallback to Authorization header
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  const admin = await prisma.admin.findUnique({
    where: { accessToken: token },
  });

  if (!admin) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  return handler(req, admin.id);
}
