"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plan, Price } from "@syncoboard/db";

export type PlanWithPrices = Plan & { prices: Price[] };

interface PlansProps {
  plans: PlanWithPrices[];
}

export function Plans({ plans }: PlansProps) {
  const [duration, setDuration] = useState<"MONTH" | "YEAR">("MONTH");

  // Filter plans to show (we can hide inactive ones just in case)
  const activePlans = plans.filter((p) => p.isActive);

  // Helper to find the right price for a plan based on the selected duration
  const getPriceForDuration = (
    plan: PlanWithPrices,
    selectedDuration: "MONTH" | "YEAR",
  ) => {
    // For free or lifetime, they usually have LIFETIME interval
    const lifetime = plan.prices.find((p) => p.interval === "LIFETIME");
    if (lifetime) return lifetime;

    // For trials, they might have WEEK
    const week = plan.prices.find((p) => p.interval === "WEEK");
    if (week) return week;

    // Otherwise, match the duration
    const match = plan.prices.find(
      (p) => p.interval === selectedDuration && p.intervalCount === 1,
    );

    // Fallback to first available if no exact match (e.g. they only have MONTH and we asked for YEAR)
    if (!match && plan.prices.length > 0) return plan.prices[0];

    return match;
  };

  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const formatPrice = (amount: number) => {
    return (amount / 100).toString();
  };

  const handleSubscribe = async (priceId: string) => {
    try {
      setLoadingPriceId(priceId);
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error(error);

        // Show a toast here as per review feedback
        // Just mock the toast or alert since ToastContext may be complex to wire here.
        // Actually, let's use standard alert if toast isn't available, or simulate.
        if (typeof window !== "undefined") {
          // Provide basic notification or toast fallback
          const toastEl = document.createElement("div");
          toastEl.innerText =
            "Checkout failed. Please login if you haven't already.";
          toastEl.style.cssText =
            "position:fixed;bottom:20px;right:20px;background:#ff4444;color:white;padding:10px 20px;border-radius:5px;z-index:9999;";
          document.body.appendChild(toastEl);
          setTimeout(() => toastEl.remove(), 3000);
        }
        return;
      }

      const data = await res.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (err) {
      console.error(err);
      if (typeof window !== "undefined") {
        const toastEl = document.createElement("div");
        toastEl.innerText = "Checkout failed.";
        toastEl.style.cssText =
          "position:fixed;bottom:20px;right:20px;background:#ff4444;color:white;padding:10px 20px;border-radius:5px;z-index:9999;";
        document.body.appendChild(toastEl);
        setTimeout(() => toastEl.remove(), 3000);
      }
    } finally {
      setLoadingPriceId(null);
    }
  };

  return (
    <section className="py-20 border-t border-white/5 z-10 relative">
      <div className="flex flex-col items-center mb-12">
        <h3 className="text-3xl font-bold text-white mb-4">Pricing</h3>
        <p className="text-syntax-grey text-center max-w-2xl">
          Start for free, upgrade when you need to collaborate.
        </p>

        <div className="mt-8 flex bg-void-grey p-1 rounded border border-white/10 font-mono text-sm">
          <button
            className={`px-4 py-2 rounded ${duration === "MONTH" ? "bg-obsidian-night text-neon-pulse border border-white/5" : "text-syntax-grey hover:text-white"}`}
            onClick={() => setDuration("MONTH")}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded ${duration === "YEAR" ? "bg-obsidian-night text-neon-pulse border border-white/5" : "text-syntax-grey hover:text-white"}`}
            onClick={() => setDuration("YEAR")}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activePlans.map((plan) => {
          const price = getPriceForDuration(plan, duration);
          const isStandard = plan.name === "Standard";
          const isTrial = plan.isTrial;
          const isFree = plan.name === "Free";

          let priceDisplay = "0";
          let intervalDisplay = "/forever";

          if (price) {
            if (price.amount === 0) {
              priceDisplay = "0";
              if (price.interval === "WEEK") intervalDisplay = "/week";
              else intervalDisplay = "/forever";
            } else {
              priceDisplay = formatPrice(price.amount);
              intervalDisplay = price.interval === "MONTH" ? "/mo" : "/yr";
            }
          }

          return (
            <div
              key={plan.id}
              className={`surface-panel p-6 border rounded-lg flex flex-col relative ${
                isStandard
                  ? "border-neon-pulse/50 bg-obsidian-night shadow-[0_0_15px_rgba(0,245,255,0.1)]"
                  : "border-white/10 bg-void-grey/30 overflow-hidden"
              }`}
            >
              {isStandard && (
                <div className="absolute -top-3 right-6 bg-neon-pulse text-obsidian-night px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              {isTrial && (
                <div className="absolute top-4 right-4 bg-white/10 text-syntax-grey text-xs px-2 py-0.5 rounded font-mono">
                  Trial
                </div>
              )}
              <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
              <div className="text-3xl font-bold text-white mb-6">
                ${priceDisplay}
                <span className="text-sm font-normal text-syntax-grey">
                  {intervalDisplay}
                </span>
              </div>
              <ul className="space-y-3 mb-8 text-syntax-grey flex-1 text-sm">
                <li className="flex items-center gap-2">
                  <span
                    className={
                      isStandard ? "text-neon-pulse" : "text-git-green"
                    }
                  >
                    ✓
                  </span>{" "}
                  {plan.maxWorkspaces === -1 ? "Unlimited" : plan.maxWorkspaces}{" "}
                  Workspace{plan.maxWorkspaces !== 1 && "s"}
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={
                      isStandard ? "text-neon-pulse" : "text-git-green"
                    }
                  >
                    ✓
                  </span>{" "}
                  {plan.maxBoardsPerWorkspace === -1
                    ? "Unlimited"
                    : plan.maxBoardsPerWorkspace}{" "}
                  Board{plan.maxBoardsPerWorkspace !== 1 && "s"}/Workspace
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={
                      isStandard ? "text-neon-pulse" : "text-git-green"
                    }
                  >
                    ✓
                  </span>{" "}
                  {plan.maxMembersPerBoard === -1
                    ? "Unlimited"
                    : plan.maxMembersPerBoard}{" "}
                  Member{plan.maxMembersPerBoard !== 1 && "s"}/Board
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={
                      isStandard ? "text-neon-pulse" : "text-git-green"
                    }
                  >
                    ✓
                  </span>{" "}
                  {plan.maxActiveBoards === -1
                    ? "Unlimited"
                    : plan.maxActiveBoards}{" "}
                  Active Board{plan.maxActiveBoards !== 1 && "s"} Total
                </li>
                {isFree && (
                  <li className="flex items-center gap-2">
                    <span className="text-git-green">✓</span> Full Git
                    Integration
                  </li>
                )}
                {isStandard && (
                  <li className="flex items-center gap-2">
                    <span className="text-neon-pulse">✓</span> Priority Sync
                  </li>
                )}
                {isTrial && (
                  <li className="flex items-center gap-2">
                    <span className="text-git-green">✓</span> Valid for 7 days
                  </li>
                )}
                {plan.name === "Premium" && (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-git-green">✓</span> SSO Integration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-git-green">✓</span> Dedicated
                      Support
                    </li>
                  </>
                )}
              </ul>
              {!isFree && !isTrial ? (
                <button
                  onClick={() => price && handleSubscribe(price.id)}
                  disabled={!price || loadingPriceId === price.id}
                  className={`w-full py-2 text-center rounded font-mono transition-colors ${
                    loadingPriceId === price?.id ? "opacity-50 cursor-wait" : ""
                  } ${
                    isStandard
                      ? "bg-neon-pulse text-obsidian-night font-bold hover:bg-neon-pulse/90"
                      : "border border-white/20 text-white hover:bg-white/5"
                  }`}
                >
                  {loadingPriceId === price?.id ? "Loading..." : "Subscribe"}
                </button>
              ) : (
                <Link
                  href="/login"
                  className={`w-full py-2 text-center rounded font-mono transition-colors ${
                    isStandard
                      ? "bg-neon-pulse text-obsidian-night font-bold hover:bg-neon-pulse/90"
                      : "border border-white/20 text-white hover:bg-white/5"
                  }`}
                >
                  {isFree ? "Get Started" : "Start Free Trial"}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
