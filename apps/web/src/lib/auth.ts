import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@syncoboard/db";

import { headers } from "next/headers";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      issuer: "https://github.com/login/oauth",
      authorization: {
        params: {
          scope: "read:user user:email",
          redirect_uri: process.env.AUTH_GITHUB_REDIRECT_URI,
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        session.user.createdAt = user.createdAt;
      }
      return session;
    },
  },
  events: {
    createUser: async ({ user }) => {
      // Create a default workspace for the new user
      const workspaceName = "MyWorkspace";

      const newWorkspace = await prisma.workspace.create({
        data: {
          name: workspaceName,
        },
      });

      // Assign the user as an ADMIN of the new workspace
      await prisma.workspaceMember.create({
        data: {
          workspaceId: newWorkspace.id,
          userId: user.id as string,
          role: "ADMIN",
        },
      });
    },
  },
});

export async function getSessionOrPat() {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  const reqHeaders = await headers();
  const authHeader = reqHeaders.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    const pat = await prisma.personalAccessToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (pat && (!pat.expiresAt || pat.expiresAt > new Date())) {
      return pat.userId;
    }
  }

  return null;
}
