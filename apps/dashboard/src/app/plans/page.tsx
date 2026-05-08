"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminApi } from "@syncoboard/api";
import { Plan } from "@syncoboard/db";

const api = new AdminApi(
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin`
    : "http://localhost:3000/api/admin",
);

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const data = await api.getPlans();
      setPlans(data);
    } catch (err: any) {
      if (err.response?.status === 401) window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan?.id) {
        await api.updatePlan(editingPlan.id, editingPlan as any);
      } else {
        await api.createPlan(editingPlan as any);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      alert("Failed to save plan");
    }
  };

  const openNewPlanModal = () => {
    setEditingPlan({
      name: "",
      maxWorkspaces: 1,
      maxBoardsPerWorkspace: 1,
      maxMembersPerBoard: 1,
      maxActiveBoards: 1,
      isTrial: false,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-space font-bold text-white mb-2">
            Plans
          </h1>
          <p className="text-gray-400">
            Manage application subscription plans and limits.
          </p>
        </div>
        <button
          onClick={openNewPlanModal}
          className="bg-neon-pulse hover:bg-neon-pulse/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Create Plan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-pulse text-neon-pulse">Loading...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-void-grey border border-glass-light p-6 rounded-xl hover:border-neon-pulse/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded border ${plan.isActive ? "bg-matrix-green/10 text-matrix-green border-matrix-green/20" : "bg-warning-flare/10 text-warning-flare border-warning-flare/20"}`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <ul className="space-y-2 text-sm text-gray-300 mb-6">
                <li className="flex justify-between">
                  <span>Max Workspaces</span>{" "}
                  <span className="font-medium text-white">
                    {plan.maxWorkspaces}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Boards / Workspace</span>{" "}
                  <span className="font-medium text-white">
                    {plan.maxBoardsPerWorkspace}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Members / Board</span>{" "}
                  <span className="font-medium text-white">
                    {plan.maxMembersPerBoard}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Active Boards</span>{" "}
                  <span className="font-medium text-white">
                    {plan.maxActiveBoards}
                  </span>
                </li>
              </ul>
              <button
                onClick={() => {
                  setEditingPlan(plan);
                  setIsModalOpen(true);
                }}
                className="w-full py-2 bg-glass-light hover:bg-white/10 text-white rounded transition-colors"
              >
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-obsidian-night/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-void-grey border border-glass-light rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPlan?.id ? "Edit Plan" : "Create New Plan"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  required
                  type="text"
                  className="w-full bg-obsidian-night border border-glass-light rounded p-2 text-white"
                  value={editingPlan?.name || ""}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, name: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Max Workspaces
                  </label>
                  <input
                    type="number"
                    className="w-full bg-obsidian-night border border-glass-light rounded p-2 text-white"
                    value={editingPlan?.maxWorkspaces || 0}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxWorkspaces: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Boards / Ws
                  </label>
                  <input
                    type="number"
                    className="w-full bg-obsidian-night border border-glass-light rounded p-2 text-white"
                    value={editingPlan?.maxBoardsPerWorkspace || 0}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxBoardsPerWorkspace: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Members / Board
                  </label>
                  <input
                    type="number"
                    className="w-full bg-obsidian-night border border-glass-light rounded p-2 text-white"
                    value={editingPlan?.maxMembersPerBoard || 0}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxMembersPerBoard: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Active Boards
                  </label>
                  <input
                    type="number"
                    className="w-full bg-obsidian-night border border-glass-light rounded p-2 text-white"
                    value={editingPlan?.maxActiveBoards || 0}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxActiveBoards: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingPlan?.isActive !== false}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      isActive: e.target.checked,
                    })
                  }
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Active
                </label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neon-pulse text-white rounded"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
