import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Successful | Syncoboard",
  description: "Your subscription was successful.",
};

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="surface-panel max-w-md w-full p-8 rounded-lg border border-neon-pulse/50 text-center relative overflow-hidden bg-obsidian-night shadow-[0_0_30px_rgba(0,245,255,0.1)]">
        <div className="w-16 h-16 bg-git-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-git-green">✓</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Success!</h1>
        <p className="text-syntax-grey mb-8">
          Your subscription is being processed. It might take a few moments for
          the payment to be confirmed and your account limits to be updated.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-neon-pulse text-obsidian-night font-bold py-3 px-8 rounded font-mono hover:bg-neon-pulse/90 transition-colors w-full"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
