import { Header } from "@/components/landing/Header";
import { PlansHero } from "@/components/landing/PlansHero";
import { MatrixBackground } from "@/components/landing/MatrixBackground";
import { Plans } from "@/components/landing/Plans";
import { Footer } from "@/components/landing/Footer";
import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";

export const metadata = {
  title: "Pricing | Syncoboard",
  description:
    "View Syncoboard plans and pricing. Start for free, upgrade when you need to collaborate.",
};

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const session = await auth();
  const plans = await prisma.plan.findMany({
    include: {
      prices: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="flex-1 flex flex-col items-center min-h-screen bg-obsidian-night relative overflow-x-hidden">
      <MatrixBackground />
      <div className="w-full max-w-6xl px-6 flex flex-col min-h-screen">
        <Header />
        <main className="flex flex-col w-full flex-1">
          <PlansHero />
          <Plans plans={plans} isLoggedIn={!!session?.user} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
