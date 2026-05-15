import React, { useState } from "react";
import { X, Bug } from "lucide-react";
import { bugApi } from "@syncoboard/api";

interface ReportBugModalProps {
  onClose: () => void;
}

export function ReportBugModal({ onClose }: ReportBugModalProps) {
  const [message, setMessage] = useState("");
  const [stack, setStack] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await bugApi.reportBug({
        message: message.trim(),
        stack: stack.trim() || undefined,
        browser: navigator.userAgent,
        url: window.location.href,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to report bug.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-mono">
      <div className="bg-obsidian-night border border-white/10 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-2 text-white font-bold">
            <Bug size={18} className="text-neon-pulse" />
            <span>Report a Bug</span>
          </div>
          <button
            onClick={onClose}
            className="text-syntax-grey hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-syntax-grey font-bold flex items-center gap-2">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What went wrong?"
              className="w-full bg-void-grey border border-white/10 rounded p-2 text-white placeholder-white/30 focus:outline-none focus:border-neon-pulse focus:ring-1 focus:ring-neon-pulse transition-all min-h-[100px] resize-y"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-syntax-grey font-bold">
              Stack Trace (Optional)
            </label>
            <textarea
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="Paste any error stack trace here if available..."
              className="w-full bg-void-grey border border-white/10 rounded p-2 text-white placeholder-white/30 focus:outline-none focus:border-neon-pulse focus:ring-1 focus:ring-neon-pulse transition-all min-h-[120px] resize-y font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-syntax-grey hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="px-4 py-2 bg-neon-pulse hover:bg-neon-pulse/90 text-obsidian-night font-bold rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="animate-pulse">Reporting...</span>
              ) : (
                <>
                  <Bug size={16} />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
