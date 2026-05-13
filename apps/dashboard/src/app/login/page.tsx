"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminApi, setGlobalApiToken } from "@syncoboard/api";

const api = new AdminApi(
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin`
    : "http://localhost:3000/api/admin",
);

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const { accessToken } = await api.login({ username, password });
      localStorage.setItem("adminToken", accessToken);
      setGlobalApiToken(accessToken);
      router.push("/users");
    } catch (err: unknown) {
      setError((err && typeof err === "object" && "response" in err ?
      (err as {response?:{data?:{message?:string}}}) /* eslint-disable-line no-restricted-syntax */.response?.data?.message : undefined) || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian-night relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-neon-pulse/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyber-purple/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 w-full max-w-md bg-void-grey/80 p-8 rounded-2xl border border-glass-light backdrop-blur-md shadow-2xl">
        <h1 className="text-3xl font-space font-bold text-center text-white mb-6">
          Admin Dashboard
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-warning-flare/20 border border-warning-flare/50 text-warning-flare rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-obsidian-night border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-neon-pulse transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-obsidian-night border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-neon-pulse transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-neon-pulse hover:bg-neon-pulse/80 text-white font-medium py-2 rounded transition-colors mt-4"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
