import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function withAdminAuth(
  req: Request,
  handler: (req: Request, adminId: string) => Promise<Response>,
) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  const token = authHeader.substring(7);
  const admin = await prisma.admin.findUnique({
    where: { accessToken: token },
  });

  if (!admin) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  return handler(req, admin.id);
}
