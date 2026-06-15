"use client";

import { useState, useEffect } from "react";
import {
  deactivateAccount,
  reactivateAccount,
  cancelSubscription,
} from "../actions";
import { useRouter } from "next/navigation";
import { subscriptionApi } from "@syncoboard/api";

interface AccountSettingsProps {
  userId: string;
  isActive: boolean;
  subscription: any;
}

export function AccountSettings({
  userId,
  isActive,
  subscription,
}: AccountSettingsProps) {
  const router = useRouter();
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [deactivateCountdown, setDeactivateCountdown] = useState(5);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelCountdown, setCancelCountdown] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysRemaining = subscription?.currentPeriodEnd
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.currentPeriodEnd).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDeactivateDialogOpen && deactivateCountdown > 0) {
      timer = setTimeout(() => {
        setDeactivateCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isDeactivateDialogOpen, deactivateCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCancelDialogOpen && cancelCountdown > 0) {
      timer = setTimeout(() => {
        setCancelCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isCancelDialogOpen, cancelCountdown]);

  const handleOpenDeactivateDialog = () => {
    setIsDeactivateDialogOpen(true);
    setDeactivateCountdown(5);
  };

  const handleOpenCancelDialog = () => {
    setIsCancelDialogOpen(true);
    setCancelCountdown(5);
  };

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    await deactivateAccount(userId);
    setIsSubmitting(false);
    setIsDeactivateDialogOpen(false);
  };

  const handleReactivate = async () => {
    setIsSubmitting(true);
    await reactivateAccount(userId);
    setIsSubmitting(false);
  };

  const handleCancelSubscription = async () => {
    if (subscription?.id) {
      setIsSubmitting(true);
      await cancelSubscription(userId, subscription.id);
      setIsSubmitting(false);
      setIsCancelDialogOpen(false);
    }
  };

  const handleResubscribe = async () => {
    if (!subscription || !subscription.priceId) {
      router.push("/plans");
    } else {
      try {
        setIsSubmitting(true);
        const data = await subscriptionApi.checkout(subscription.priceId);
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto border border-white/10 bg-void-grey p-6 shadow-xl">
      <h2 className="text-xl font-bold font-mono text-white mb-6">
        Account Settings
      </h2>

      {/* Subscription Section */}
      <div className="mb-8 border-b border-white/10 pb-8">
        <h3 className="text-lg font-bold font-mono text-white mb-4">
          Subscription
        </h3>

        {subscription ? (
          <div className="space-y-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-white">
                  {subscription.price?.plan?.name || "Unknown Plan"}
                  {subscription.price && subscription.price.amount > 0 && (
                    <span className="text-sm font-normal text-syntax-grey ml-2">
                      - ${subscription.price.amount / 100}
                      {subscription.price.interval === "MONTH" ? "/mo" : subscription.price.interval === "YEAR" ? "/yr" : subscription.price.interval === "WEEK" ? "/week" : ""}
                    </span>
                  )}
                </h4>
                <div className="text-sm font-mono text-syntax-grey">
                  Status: {subscription.status}
                  {subscription.cancelAtPeriodEnd &&
                    " (Canceling at period end)"}
                </div>
                {daysRemaining !== null &&
                  subscription.price?.plan?.name !== "Free" && (
                    <div className="text-sm font-mono text-syntax-grey mt-1">
                      Days remaining to renew: {daysRemaining}
                    </div>
                  )}
              </div>
            </div>

            {subscription.price?.plan && (
              <div className="bg-void-grey/50 border border-white/10 p-4 rounded mb-4">
                <h5 className="text-sm font-bold text-white mb-3">
                  Plan Perks
                </h5>
                <ul className="space-y-2 text-syntax-grey text-sm font-mono">
                  <li className="flex items-center gap-2">
                    <span
                      className={
                        subscription.price.plan.name === "Standard"
                          ? "text-neon-pulse"
                          : "text-git-green"
                      }
                    >
                      ✓
                    </span>{" "}
                    {subscription.price.plan.maxWorkspaces === -1
                      ? "Unlimited"
                      : subscription.price.plan.maxWorkspaces}{" "}
                    Workspace
                    {subscription.price.plan.maxWorkspaces !== 1 && "s"}
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={
                        subscription.price.plan.name === "Standard"
                          ? "text-neon-pulse"
                          : "text-git-green"
                      }
                    >
                      ✓
                    </span>{" "}
                    {subscription.price.plan.maxBoardsPerWorkspace === -1
                      ? "Unlimited"
                      : subscription.price.plan.maxBoardsPerWorkspace}{" "}
                    Board
                    {subscription.price.plan.maxBoardsPerWorkspace !== 1 && "s"}
                    /Workspace
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={
                        subscription.price.plan.name === "Standard"
                          ? "text-neon-pulse"
                          : "text-git-green"
                      }
                    >
                      ✓
                    </span>{" "}
                    {subscription.price.plan.maxMembersPerBoard === -1
                      ? "Unlimited"
                      : subscription.price.plan.maxMembersPerBoard}{" "}
                    Member
                    {subscription.price.plan.maxMembersPerBoard !== 1 && "s"}
                    /Board
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={
                        subscription.price.plan.name === "Standard"
                          ? "text-neon-pulse"
                          : "text-git-green"
                      }
                    >
                      ✓
                    </span>{" "}
                    {subscription.price.plan.maxActiveBoards === -1
                      ? "Unlimited"
                      : subscription.price.plan.maxActiveBoards}{" "}
                    Active Board
                    {subscription.price.plan.maxActiveBoards !== 1 && "s"} Total
                  </li>
                  {subscription.price.plan.name === "Free" && (
                    <li className="flex items-center gap-2">
                      <span className="text-git-green">✓</span> Full Git
                      Integration
                    </li>
                  )}
                  {subscription.price.plan.name === "Standard" && (
                    <li className="flex items-center gap-2">
                      <span className="text-neon-pulse">✓</span> Priority Sync
                    </li>
                  )}
                  {subscription.price.plan.isTrial && (
                    <li className="flex items-center gap-2">
                      <span className="text-git-green">✓</span> Valid for 7 days
                    </li>
                  )}
                  {subscription.price.plan.name === "Premium" && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="text-git-green">✓</span> SSO
                        Integration
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-git-green">✓</span> Dedicated
                        Support
                      </li>
                    </>
                  )}
                </ul>
              </div>
            )}

            {subscription.status === "PAST_DUE" &&
              !subscription.cancelAtPeriodEnd && (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleResubscribe}
                    className="w-full bg-git-green text-obsidian-night font-bold font-mono py-2 hover:bg-opacity-90 transition-opacity cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
                  >
                    Pay Now
                  </button>
                  <button
                    onClick={handleOpenCancelDialog}
                    disabled={isSubmitting}
                    className="w-full bg-red-500/20 text-red-500 border border-red-500/50 font-bold font-mono py-2 hover:bg-red-500/30 transition-colors disabled:opacity-50 cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-red-500 [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}

            {subscription.status === "ACTIVE" &&
              !subscription.cancelAtPeriodEnd &&
              subscription.price?.plan?.name !== "Free" && (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => router.push("/plans")}
                    className="w-full bg-white/10 text-white border border-white/20 font-bold font-mono py-2 hover:bg-white/20 transition-colors cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
                  >
                    Explore Plans
                  </button>
                  <button
                    onClick={handleOpenCancelDialog}
                    disabled={isSubmitting}
                    className="w-full bg-red-500/20 text-red-500 border border-red-500/50 font-bold font-mono py-2 hover:bg-red-500/30 transition-colors disabled:opacity-50 cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-red-500 [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
                  >
                    Cancel Subscription
                  </button>
                </div>
              )}

            {subscription.status === "ACTIVE" &&
              !subscription.cancelAtPeriodEnd &&
              subscription.price?.plan?.name === "Free" && (
                <button
                  onClick={() => router.push("/plans")}
                  className="w-full bg-git-green text-obsidian-night font-bold font-mono py-2 hover:bg-opacity-90 transition-opacity cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
                >
                  Upgrade
                </button>
              )}

            {(!subscription ||
              subscription.cancelAtPeriodEnd ||
              subscription.status === "CANCELED") && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleResubscribe}
                  className="w-full bg-git-green text-obsidian-night font-bold font-mono py-2 hover:bg-opacity-90 transition-opacity cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
                >
                  Resubscribe
                </button>
                {(subscription?.cancelAtPeriodEnd ||
                  subscription?.status === "CANCELED") && (
                  <button
                    onClick={() => router.push("/plans")}
                    className="w-full bg-white/10 text-white border border-white/20 font-bold font-mono py-2 hover:bg-white/20 transition-colors cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
                  >
                    Change Plan
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-mono text-syntax-grey">
              You do not have an active subscription.
            </div>
            <button
              onClick={handleResubscribe}
              className="w-full bg-git-green text-obsidian-night font-bold font-mono py-2 hover:bg-opacity-90 transition-opacity cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
            >
              Subscribe
            </button>
          </div>
        )}
      </div>

      {/* Account Section */}
      <div>
        <h3 className="text-lg font-bold font-mono text-white mb-4">
          Deactivation
        </h3>

        {!isActive ? (
          <button
            onClick={handleReactivate}
            disabled={isSubmitting}
            className="w-full bg-git-green text-obsidian-night font-bold font-mono py-2 hover:bg-opacity-90 transition-opacity disabled:opacity-50 cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
          >
            {isSubmitting ? "Reactivating..." : "Reactivate Account"}
          </button>
        ) : (
          <button
            onClick={handleOpenDeactivateDialog}
            className="w-full bg-red-500/20 text-red-500 border border-red-500/50 font-bold font-mono py-2 hover:bg-red-500/30 transition-colors cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-red-500 [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
          >
            Deactivate Account
          </button>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {isCancelDialogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-void-grey border border-red-500/50 p-6 max-w-md w-full shadow-2xl cmd-container cmd-active-container">
            <h3 className="text-xl font-bold text-red-500 mb-4 font-mono">
              Confirm Cancellation
            </h3>
            <p className="text-white/80 font-mono text-sm mb-4">
              Are you sure you want to cancel your subscription?
            </p>
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-200 font-mono text-sm">
                <strong>Warning:</strong> You will lose access to premium
                features at the end of your current billing period.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsCancelDialogOpen(false)}
                className="flex-1 bg-white/10 text-white font-mono py-2 hover:bg-white/20 transition-colors cmd-selectable [&.cmd-selected]:bg-white/20"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelCountdown > 0 || isSubmitting}
                className="flex-1 bg-red-500 text-white font-bold font-mono py-2 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
              >
                {isSubmitting
                  ? "Canceling..."
                  : cancelCountdown > 0
                    ? `Wait (${cancelCountdown}s)`
                    : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Dialog */}
      {isDeactivateDialogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-void-grey border border-red-500/50 p-6 max-w-md w-full shadow-2xl cmd-container cmd-active-container">
            <h3 className="text-xl font-bold text-red-500 mb-4 font-mono">
              Confirm Deactivation
            </h3>
            <p className="text-white/80 font-mono text-sm mb-4">
              Are you sure you want to deactivate your account?
            </p>
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-200 font-mono text-sm">
                <strong>Warning:</strong> All boards where you are an ADMIN will
                be deactivated. This action will not affect other members, but
                the board will appear as inactive to them.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsDeactivateDialogOpen(false)}
                className="flex-1 bg-white/10 text-white font-mono py-2 hover:bg-white/20 transition-colors cmd-selectable [&.cmd-selected]:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivateCountdown > 0 || isSubmitting}
                className="flex-1 bg-red-500 text-white font-bold font-mono py-2 hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
              >
                {isSubmitting
                  ? "Deactivating..."
                  : deactivateCountdown > 0
                    ? `Wait (${deactivateCountdown}s)`
                    : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
