import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Cancelled | Syncoboard",
  description: "Your subscription process was cancelled.",
};

export default function CancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="surface-panel max-w-md w-full p-8 rounded-lg border border-error-red/50 text-center relative overflow-hidden bg-obsidian-night">
        <div className="w-16 h-16 bg-error-red/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-error-red">✕</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Cancelled</h1>
        <p className="text-syntax-grey mb-8">
          Your checkout process was cancelled. You have not been charged.
        </p>
        <Link
          href="/"
          className="inline-block border border-white/20 text-white py-3 px-8 rounded font-mono hover:bg-white/5 transition-colors w-full"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
