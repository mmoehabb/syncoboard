import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../index";

async function main() {
  const existingPlansCount = await prisma.plan.count();
  if (existingPlansCount > 0) {
    console.log("Data already seeded. Skipping...");
    return;
  }

  const existingAdminCount = await prisma.admin.count();
  if (existingAdminCount === 0) {
    console.log("Seeding initial admin user...");
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    let adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      adminPassword = crypto.randomBytes(16).toString("hex");
      console.log(
        "--------------------------------------------------------------------------------",
      );
      console.log(`INITIAL ADMIN USERNAME: ${adminUsername}`);
      console.log(`INITIAL ADMIN PASSWORD: ${adminPassword}`);
      console.log(
        "PLEASE SAVE THESE CREDENTIALS. YOU CAN ALSO SET THEM VIA ADMIN_USERNAME AND ADMIN_PASSWORD ENV VARS.",
      );
      console.log(
        "--------------------------------------------------------------------------------",
      );
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
      },
    });
    console.log(`Created initial admin user: ${adminUsername}`);
  }

  console.log("Seeding plans...");

  // 1. Free Plan
  const freePlan = await prisma.plan.create({
    data: {
      name: "Free",
      maxWorkspaces: 1,
      maxBoardsPerWorkspace: 1,
      maxMembersPerBoard: 1,
      maxActiveBoards: 1,
      isTrial: false,
      prices: {
        create: [
          {
            amount: 0,
            interval: "LIFETIME",
            intervalCount: 1,
          },
        ],
      },
    },
  });
  console.log(`Created plan: ${freePlan.name}`);

  // 2. Standard Plan
  const standardPlan = await prisma.plan.create({
    data: {
      name: "Standard",
      maxWorkspaces: 10,
      maxBoardsPerWorkspace: 10,
      maxMembersPerBoard: 20,
      maxActiveBoards: 5,
      isTrial: false,
      prices: {
        create: [
          {
            amount: 1200, // $12
            interval: "MONTH",
            intervalCount: 1,
          },
          {
            amount: 3000, // $30
            interval: "MONTH",
            intervalCount: 3,
          },
          {
            amount: 9600, // $96
            interval: "YEAR",
            intervalCount: 1,
          },
        ],
      },
    },
  });
  console.log(`Created plan: ${standardPlan.name}`);

  // 3. Trial Plan
  const trialPlan = await prisma.plan.create({
    data: {
      name: "Standard Trial",
      maxWorkspaces: 10,
      maxBoardsPerWorkspace: 10,
      maxMembersPerBoard: 20,
      maxActiveBoards: 5,
      isTrial: true,
      prices: {
        create: [
          {
            amount: 0,
            interval: "WEEK",
            intervalCount: 1,
          },
        ],
      },
    },
  });
  console.log(`Created plan: ${trialPlan.name}`);

  // 4. Premium Plan
  const premiumPlan = await prisma.plan.create({
    data: {
      name: "Premium",
      maxWorkspaces: 25,
      maxBoardsPerWorkspace: 50,
      maxMembersPerBoard: -1, // Unlimited
      maxActiveBoards: -1, // Unlimited
      isTrial: false,
      prices: {
        create: [
          {
            amount: 3000, // $30
            interval: "MONTH",
            intervalCount: 1,
          },
          {
            amount: 8000, // $80
            interval: "MONTH",
            intervalCount: 3,
          },
          {
            amount: 25000, // $250
            interval: "YEAR",
            intervalCount: 1,
          },
        ],
      },
    },
  });
  console.log(`Created plan: ${premiumPlan.name}`);

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
