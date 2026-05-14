import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { MatrixBackground } from "@/components/landing/MatrixBackground";
import { Idea } from "@/components/landing/Idea";
import { Plans } from "@/components/landing/Plans";
import { Footer } from "@/components/landing/Footer";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@syncoboard/db";

export const dynamic = "force-dynamic";

export default async function Home(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const searchParams = await props.searchParams;

  if (session?.user && searchParams.redirect !== "false") {
    redirect("/dashboard");
  }

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
      <div className="w-full max-w-6xl px-6 flex flex-col">
        <Header />
        <main className="flex flex-col w-full">
          <Hero />
          <Idea />
          <Plans plans={plans} isLoggedIn={!!session?.user} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
