import { enforceSubscriptionLimits } from "./packages/utils/src/subscription-limits";
import { prisma } from "./packages/db/index";
import { performance } from "perf_hooks";

async function runBenchmark() {
  console.log("Setting up benchmark...");
  // Assuming there's a user we can use, or we can just mock it.
  // Actually let's just mock prisma.plan.findFirst

  const originalFindFirst = prisma.plan.findFirst;
  let findFirstCalls = 0;

  // @ts-ignore
  prisma.plan.findFirst = async (args) => {
    findFirstCalls++;
    // simulate DB latency
    await new Promise(resolve => setTimeout(resolve, 2));
    return { id: "free-plan", name: "Free", maxWorkspaces: 1, maxActiveBoards: 1 };
  };

  const originalFindManyWorkspace = prisma.workspace.findMany;
  const originalFindManyBoard = prisma.board.findMany;

  // @ts-ignore
  prisma.workspace.findMany = async () => [];
  // @ts-ignore
  prisma.board.findMany = async () => [];

  // @ts-ignore
  const originalSubFindFirst = prisma.subscription.findFirst;
  // @ts-ignore
  prisma.subscription.findFirst = async () => null;

  const iterations = 100;

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await enforceSubscriptionLimits("user-1", null);
  }
  const end = performance.now();

  console.log(`Benchmark completed in ${end - start} ms`);
  console.log(`findFirst was called ${findFirstCalls} times`);

  // Restore
  prisma.plan.findFirst = originalFindFirst;
  prisma.workspace.findMany = originalFindManyWorkspace;
  prisma.board.findMany = originalFindManyBoard;
  prisma.subscription.findFirst = originalSubFindFirst;
}

runBenchmark().catch(console.error);
