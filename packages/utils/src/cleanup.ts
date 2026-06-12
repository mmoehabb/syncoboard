import { prisma } from "@syncoboard/db";

/**
 * Permanently deletes workspaces and boards that have been marked as isDeleted
 * for more than 3 months.
 */
export async function cleanupDeletedEntities() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  try {
    // We should delete the boards first. Although Cascade delete might be set up,
    // explicitly deleting them ensures any pre-delete hooks or cleanup logs happen.
    const deletedBoards = await prisma.board.deleteMany({
      where: {
        isDeleted: true,
        updatedAt: {
          lt: threeMonthsAgo,
        },
      },
    });

    const deletedWorkspaces = await prisma.workspace.deleteMany({
      where: {
        isDeleted: true,
        updatedAt: {
          lt: threeMonthsAgo,
        },
      },
    });

    return {
      boards: deletedBoards.count,
      workspaces: deletedWorkspaces.count,
    };
  } catch (error) {
    console.error("Error during cleanup of deleted entities:", error);
    // Rethrow to allow the cron job to catch and potentially alert
    throw error;
  }
}
