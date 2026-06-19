"use client";

import { useState } from "react";
import { subscribeToFreePlan, subscribeToTrialPlan } from "../actions";
import type { PlanWithPrices } from "./types";
import Link from "next/link";
import { subscriptionApi } from "@syncoboard/api";

interface SubscriptionModalProps {
  allPlans: PlanWithPrices[];
  bottomLink: string;
  bottomText: string;
}

export function SubscriptionModal({
  allPlans,
  bottomLink,
  bottomText,
}: SubscriptionModalProps) {
  const [error, setError] = useState<string | null>(null);

  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    try {
      setError(null);
      setLoadingPriceId(priceId);
      const data = await subscriptionApi.checkout(priceId);
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (err: any) {
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoadingPriceId(null);
    }
  };

  const handleFreePlan = async () => {
    setError(null);
    const res = await subscribeToFreePlan();
    if (res?.error) {
      setError(res.error);
    }
  };

  const handleTrialPlan = async (planId: string) => {
    setError(null);
    const res = await subscribeToTrialPlan(planId);
    if (res?.error) {
      setError(res.error);
    }
  };

  return (
    <div className="absolute inset-0 bg-obsidian-night/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full surface-panel p-8 bg-void-grey border border-neon-pulse/50 shadow-2xl rounded-md flex flex-col gap-8 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-2 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Subscription Required
          </h2>
          <p className="text-syntax-grey text-sm font-mono leading-relaxed">
            Syncoboard is currently free while we scale and refine the product
            with early adopters. Create your board, connect your repos, and help
            us build the future of code-driven project management.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-md text-sm font-mono text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto w-full">
          {allPlans
            .filter((plan) => plan.name === "Free")
            .map((plan) => {
              const price = plan.prices[0];
              const isFree = plan.name === "Free";
              const isTrial = plan.isTrial;
              const requiresPayment = !isFree && !isTrial;

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col border rounded-md p-6 relative group transition-all ${isFree || isTrial ? "border-white/10 bg-obsidian-night/50 hover:border-git-green/50" : "border-white/10 bg-obsidian-night/50 opacity-60"}`}
                >
                  {requiresPayment && (
                    <div className="absolute top-4 right-4 bg-white/10 text-syntax-grey text-xs px-2 py-0.5 rounded font-mono">
                      soon
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    {plan.name}{" "}
                    {plan.name === "Premium" && (
                      <span className="text-neon-pulse">★</span>
                    )}
                  </h3>
                  <div className="text-2xl font-mono mb-6 text-white">
                    {isFree || isTrial ? (
                      <span
                        className={
                          isTrial ? "text-neon-pulse" : "text-git-green"
                        }
                      >
                        Free
                      </span>
                    ) : (
                      <>
                        ${price ? (price.amount / 100).toFixed(0) : "0"}
                        <span className="text-sm text-syntax-grey">
                          /{price?.interval.toLowerCase()}
                        </span>
                      </>
                    )}
                  </div>
                  <ul className="text-sm font-mono text-syntax-grey flex flex-col gap-3 flex-1 mb-8">
                    <li className="flex items-center gap-2">
                      <span
                        className={
                          isTrial || plan.name === "Premium"
                            ? "text-neon-pulse"
                            : isFree
                              ? "text-git-green"
                              : "text-syntax-grey"
                        }
                      >
                        ✓
                      </span>{" "}
                      {plan.maxWorkspaces === -1
                        ? "Unlimited"
                        : plan.maxWorkspaces}{" "}
                      Workspaces
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={
                          isTrial || plan.name === "Premium"
                            ? "text-neon-pulse"
                            : isFree
                              ? "text-git-green"
                              : "text-syntax-grey"
                        }
                      >
                        ✓
                      </span>{" "}
                      {plan.maxBoardsPerWorkspace === -1
                        ? "Unlimited"
                        : plan.maxBoardsPerWorkspace}{" "}
                      Boards/Workspace
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={
                          isTrial || plan.name === "Premium"
                            ? "text-neon-pulse"
                            : isFree
                              ? "text-git-green"
                              : "text-syntax-grey"
                        }
                      >
                        ✓
                      </span>{" "}
                      {plan.maxMembersPerBoard === -1
                        ? "Unlimited"
                        : plan.maxMembersPerBoard}{" "}
                      Members/Board
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={
                          isTrial || plan.name === "Premium"
                            ? "text-neon-pulse"
                            : isFree
                              ? "text-git-green"
                              : "text-syntax-grey"
                        }
                      >
                        ✓
                      </span>{" "}
                      {plan.maxActiveBoards === -1
                        ? "Unlimited"
                        : plan.maxActiveBoards}{" "}
                      Active Boards Total
                    </li>
                  </ul>

                  {isFree && (
                    <div className="mt-auto">
                      <button
                        onClick={handleFreePlan}
                        className="w-full bg-void-grey border border-git-green/30 hover:border-git-green hover:bg-git-green/10 transition-all rounded py-2.5 text-white font-mono text-sm cursor-pointer"
                      >
                        Get Started
                      </button>
                    </div>
                  )}

                  {isTrial && (
                    <div className="mt-auto">
                      <button
                        onClick={() => handleTrialPlan(plan.id)}
                        className="w-full bg-void-grey border border-neon-pulse/30 hover:border-neon-pulse hover:bg-neon-pulse/10 transition-all rounded py-2.5 text-white font-mono text-sm cursor-pointer"
                      >
                        Start Trial
                      </button>
                    </div>
                  )}

                  {requiresPayment && (
                    <div className="mt-auto">
                      <button
                        onClick={() => handleSubscribe(price.id)}
                        disabled={loadingPriceId === price.id}
                        className={`w-full bg-void-grey border ${loadingPriceId === price.id ? "opacity-50 border-white/10" : "border-white/10 hover:border-white/20 hover:text-neon-pulse"} rounded py-2.5 text-white font-mono text-sm transition-colors text-center inline-block cursor-pointer`}
                      >
                        {loadingPriceId === price.id
                          ? "Loading..."
                          : "Subscribe"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="text-center mt-4">
          <Link
            href={bottomLink}
            className="text-syntax-grey hover:text-white font-mono text-sm underline underline-offset-4 decoration-white/20 hover:decoration-white transition-colors"
          >
            {bottomText}
          </Link>
        </div>
      </div>
    </div>
  );
}
