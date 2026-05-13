"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminApi } from "@syncoboard/api";

const api = new AdminApi(
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin`
    : "http://localhost:3000/api/admin",
);

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string) => {
    // Requires min 8 chars, 1 number, 1 letter, 1 symbol
    const minLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return minLength && hasNumber && hasLetter && hasSymbol;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError(
        "Password must be at least 8 characters long and contain at least one letter, one number, and one symbol.",
      );
      return;
    }

    setLoading(true);

    try {
      // Cast api to any to bypass TS error until we update AdminApi in the next step
      await api.changePassword({ currentPassword, newPassword });
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError((err && typeof err === "object" && "response" in err ? /* eslint-disable-next-line no-restricted-syntax */ (err as {response?:{data?:{message?:string}}}).response?.data?.message : undefined) || "Failed to update password.");
      if (
        (err && typeof err === "object" && "response" in err ?
        /* eslint-disable-next-line no-restricted-syntax */ (err as {response?:{status?:number}}) .response?.status : undefined) === 401 &&
        (err && typeof err === "object" && "response" in err ? /* eslint-disable-next-line no-restricted-syntax */ (err as {response?:{data?:{message?:string}}}).response?.data?.message : undefined) !== "Invalid current password"
      ) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-space font-bold text-white mb-2">
          Settings
        </h1>
        <p className="text-gray-400">Manage your admin account settings.</p>
      </div>

      <div className="bg-void-grey border border-glass-light p-6 rounded-xl max-w-xl">
        <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>

        {error && (
          <div className="mb-4 p-3 bg-warning-flare/20 border border-warning-flare/50 text-warning-flare rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-matrix-green/20 border border-matrix-green/50 text-matrix-green rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-obsidian-night border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-neon-pulse transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-obsidian-night border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-neon-pulse transition-colors"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters, and contain a letter, a number, and
              a symbol.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-obsidian-night border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-neon-pulse transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-neon-pulse hover:bg-neon-pulse/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition-colors mt-4"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
