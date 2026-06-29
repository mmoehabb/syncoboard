"use server";

import { prisma } from "@syncoboard/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export async function getAdminContexts() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  const userId = session.user.id;

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: { some: { userId, role: "ADMIN" } },
    },
    select: { id: true, name: true },
  });

  const boards = await prisma.board.findMany({
    where: {
      members: { some: { userId, role: "ADMIN" } },
    },
    select: { id: true, name: true, workspaceId: true },
  });

  return { workspaces, boards };
}

export async function getMembers(type: "workspace" | "board", id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  const userId = session.user.id;

  if (type === "workspace") {
    const admin = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });
    if (admin?.role !== "ADMIN") return { error: "Unauthorized" };

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return members.map((m) => ({
      id: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));
  } else {
    const admin = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId: id, userId } },
    });
    if (admin?.role !== "ADMIN") return { error: "Unauthorized" };

    const members = await prisma.boardMember.findMany({
      where: { boardId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return members.map((m) => ({
      id: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));
  }
}

export async function updateMemberRole(
  type: "workspace" | "board",
  id: string,
  targetUserId: string,
  newRole: Role,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  const userId = session.user.id;

  if (type === "workspace") {
    const admin = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });
    if (admin?.role !== "ADMIN")
      return { error: "Unauthorized to modify roles" };

    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: id, userId: targetUserId } },
      data: { role: newRole },
    });
  } else {
    const admin = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId: id, userId } },
    });
    if (admin?.role !== "ADMIN")
      return { error: "Unauthorized to modify roles" };

    await prisma.boardMember.update({
      where: { boardId_userId: { boardId: id, userId: targetUserId } },
      data: { role: newRole },
    });
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function removeMember(
  type: "workspace" | "board",
  id: string,
  targetUserId: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  const userId = session.user.id;

  if (type === "workspace") {
    const admin = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });
    if (admin?.role !== "ADMIN")
      return { error: "Unauthorized to remove members" };

    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId: id, userId: targetUserId } },
    });
  } else {
    const admin = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId: id, userId } },
    });
    if (admin?.role !== "ADMIN")
      return { error: "Unauthorized to remove members" };

    await prisma.boardMember.delete({
      where: { boardId_userId: { boardId: id, userId: targetUserId } },
    });
  }
  revalidatePath("/settings");
  return { success: true };
}

export async function addMemberByEmail(
  type: "workspace" | "board",
  id: string,
  email: string,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }
  const userId = session.user.id;

  const targetUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!targetUser) {
    throw new Error(
      `We couldn't find a user with the email address ${email}. Please check the email and try again.`,
    );
  }

  if (type === "workspace") {
    const admin = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId } },
    });
    if (admin?.role !== "ADMIN") return { error: "Unauthorized to add members" };

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: id, userId: targetUser.id } },
    });
    if (existing)
      return { error: "User is already a member of this workspace." };

    await prisma.workspaceMember.create({
      data: {
        workspaceId: id,
        userId: targetUser.id,
        role: "MEMBER",
      },
    });
  } else {
    const admin = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId: id, userId } },
    });
    if (admin?.role !== "ADMIN") return { error: "Unauthorized to add members" };

    const existing = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId: id, userId: targetUser.id } },
    });
    if (existing) return { error: "User is already a member of this board." };

    await prisma.boardMember.create({
      data: {
        boardId: id,
        userId: targetUser.id,
        role: "MEMBER",
      },
    });
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function getUserBoards(userId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== userId) {
    return { error: "Unauthorized" };
  }

  const boards = await prisma.board.findMany({
    where: {
      isDeleted: false,
      members: { some: { userId } },
    },
    include: {
      workspace: { select: { name: true } },
      members: { where: { userId }, select: { role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return boards.map((b) => ({
    id: b.id,
    name: b.name,
    workspaceName: b.workspace.name,
    role: b.members[0]?.role || "MEMBER",
  }));
}
