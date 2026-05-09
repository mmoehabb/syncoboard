"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminApi, AdminUser } from "@syncoboard/api";

const api = new AdminApi(
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin`
    : "http://localhost:3000/api/admin",
);

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await api.getUsers();
        setUsers(data);
      } catch (err: any) {
        setError("Failed to load users");
        if (err.response?.status === 401) {
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-space font-bold text-white mb-2">Users</h1>
        <p className="text-gray-400">
          Manage registered users and view their statistics.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-warning-flare/20 text-warning-flare rounded-lg border border-warning-flare/30">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-pulse flex space-x-2">
            <div className="w-3 h-3 bg-neon-pulse rounded-full"></div>
            <div className="w-3 h-3 bg-neon-pulse rounded-full animation-delay-200"></div>
            <div className="w-3 h-3 bg-neon-pulse rounded-full animation-delay-400"></div>
          </div>
        </div>
      ) : (
        <div className="bg-void-grey rounded-xl border border-glass-light overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-obsidian-night border-b border-glass-light text-sm text-gray-400">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium text-center">Workspaces</th>
                <th className="p-4 font-medium text-center">Boards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-light">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-glass-light/50 transition-colors"
                  >
                    <td className="p-4 font-medium text-white">
                      {user.name || "N/A"}
                    </td>
                    <td className="p-4 text-gray-300">{user.email || "N/A"}</td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-1 bg-neon-pulse/10 text-neon-pulse rounded text-xs font-medium border border-neon-pulse/20">
                        {user.workspaceCount}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-2 py-1 bg-matrix-green/10 text-matrix-green rounded text-xs font-medium border border-matrix-green/20">
                        {user.boardCount}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
