"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminApi } from "@syncoboard/api";
import { BugReport } from "@syncoboard/db";

const api = new AdminApi(
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin`
    : "http://localhost:3000/api/admin",
);

export default function ReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStack, setSelectedStack] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getReports({ page, limit, search });
      setReports(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError("Failed to load reports");
      if (err.response?.status === 401) {
        window.location.href = "/login";
      }
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold text-white mb-2">
            Bug Reports
          </h1>
          <p className="text-gray-400">View and manage reported bugs.</p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          <input
            type="text"
            placeholder="Search reports..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full md:w-64 px-4 py-2 bg-obsidian-night border border-glass-light rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-pulse focus:ring-1 focus:ring-neon-pulse"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neon-pulse/10 text-neon-pulse rounded-lg font-medium border border-neon-pulse/20 hover:bg-neon-pulse/20 transition-colors"
          >
            Search
          </button>
        </form>
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
        <>
          <div className="bg-void-grey rounded-xl border border-glass-light overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-obsidian-night border-b border-glass-light text-sm text-gray-400">
                  <th className="p-4 font-medium">Reported At</th>
                  <th className="p-4 font-medium">User ID</th>
                  <th className="p-4 font-medium">URL</th>
                  <th className="p-4 font-medium">Browser</th>
                  <th className="p-4 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-light">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No bug reports found.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-glass-light/50 transition-colors cursor-pointer"
                      onClick={() =>
                        setSelectedStack(
                          report.stack || "No stack trace available.",
                        )
                      }
                    >
                      <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-gray-300 text-sm">
                        {report.userId || "Anonymous"}
                      </td>
                      <td
                        className="p-4 text-gray-300 text-sm max-w-[200px] truncate"
                        title={report.url || ""}
                      >
                        {report.url || "N/A"}
                      </td>
                      <td
                        className="p-4 text-gray-300 text-sm max-w-[150px] truncate"
                        title={report.browser || ""}
                      >
                        {report.browser || "N/A"}
                      </td>
                      <td
                        className="p-4 font-medium text-white max-w-[300px] truncate"
                        title={report.message || ""}
                      >
                        {report.message || "No message"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, total)} of {total} reports
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-void-grey border border-glass-light rounded-lg text-white hover:bg-glass-light/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
                className="px-4 py-2 bg-void-grey border border-glass-light rounded-lg text-white hover:bg-glass-light/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {selectedStack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-void-grey border border-glass-light rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-glass-light flex items-center justify-between">
              <h3 className="text-lg font-space font-bold text-white">
                Stack Trace
              </h3>
              <button
                onClick={() => setSelectedStack(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap break-all font-mono">
                {selectedStack}
              </pre>
            </div>
            <div className="p-4 border-t border-glass-light text-right">
              <button
                onClick={() => setSelectedStack(null)}
                className="px-4 py-2 bg-glass-light/20 border border-glass-light rounded-lg text-white hover:bg-glass-light/40 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
