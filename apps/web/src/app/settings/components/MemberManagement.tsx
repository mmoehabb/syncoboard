"use client";

import { useState, useEffect } from "react";
import {
  getAdminContexts,
  getMembers,
  updateMemberRole,
  removeMember,
  addMemberByEmail,
} from "../memberActions";
import { Role } from "@prisma/client";
import { useToast } from "@/context/ToastContext";
import { SimpleConfirmationModal } from "@/components/modals/SimpleConfirmationModal";

export function MemberManagement({ userId }: { userId: string }) {
  const { showToast } = useToast();
  const [contexts, setContexts] = useState<{
    workspaces: { id: string; name: string }[];
    boards: { id: string; name: string; workspaceId: string }[];
  }>({ workspaces: [], boards: [] });
  const [selectedType, setSelectedType] = useState<
    "workspace" | "board" | null
  >(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [members, setMembers] = useState<
    { id: string; name: string | null; email: string | null; role: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    action: (() => Promise<void>) | null;
  }>({ isOpen: false, message: "", action: null });

  useEffect(() => {
    getAdminContexts().then((res: any) => {
      if (res?.error) {
        showToast(res.error, "error");
      } else {
        setContexts(res);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedType && selectedId) {
      setLoading(true);
      setError(null);
      getMembers(selectedType, selectedId)
        .then((res: any) => {
          if (res?.error) {
            setError(res.error);
          } else {
            setMembers(res);
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setMembers([]);
    }
  }, [selectedType, selectedId]);

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    if (!selectedType || !selectedId) return;
    try {
      const res = await updateMemberRole(
        selectedType,
        selectedId,
        memberId,
        newRole,
      );
      if (res?.error) {
        showToast(res.error, "error");
        return;
      }
      const updated: any = await getMembers(selectedType, selectedId);
      if (updated?.error) {
        showToast(updated.error, "error");
      } else {
        setMembers(updated);
        showToast("Role updated successfully", "success");
      }
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!selectedType || !selectedId) return;
    setConfirmModal({
      isOpen: true,
      message: "Are you sure you want to remove this member?",
      action: async () => {
        try {
          const res = await removeMember(selectedType, selectedId, memberId);
          if (res?.error) {
            showToast(res.error, "error");
            return;
          }
          const updated: any = await getMembers(selectedType, selectedId);
          if (updated?.error) {
            showToast(updated.error, "error");
          } else {
            setMembers(updated);
            showToast("Member removed successfully", "success");
          }
        } catch (e: any) {
          showToast(e.message, "error");
        } finally {
          setConfirmModal({ isOpen: false, message: "", action: null });
        }
      },
    });
  };

  const handleAddMember = async () => {
    if (!selectedType || !selectedId || !newMemberEmail) return;
    setAdding(true);
    setError(null);
    try {
      const res = await addMemberByEmail(
        selectedType,
        selectedId,
        newMemberEmail,
      );
      if (res?.error) {
        showToast(res.error, "error");
        return;
      }
      const updated: any = await getMembers(selectedType, selectedId);
      if (updated?.error) {
        showToast(updated.error, "error");
      } else {
        setMembers(updated);
        setNewMemberEmail("");
        showToast("Member added successfully", "success");
      }
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <SimpleConfirmationModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.action || (() => {})}
        onCancel={() =>
          setConfirmModal({ isOpen: false, message: "", action: null })
        }
      />
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white">Member Management</h2>
        <p className="text-sm text-syntax-grey">
          Manage members for boards and workspaces where you are an ADMIN.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-mono text-syntax-grey w-24">
            Select Type
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedType("workspace");
                setSelectedId("");
              }}
              className={`px-4 py-2 text-sm font-mono transition-colors border ${
                selectedType === "workspace"
                  ? "bg-white/10 border-git-green text-white"
                  : "bg-void-grey border-white/10 text-syntax-grey hover:text-white"
              }`}
            >
              Workspace
            </button>
            <button
              onClick={() => {
                setSelectedType("board");
                setSelectedId("");
              }}
              className={`px-4 py-2 text-sm font-mono transition-colors border ${
                selectedType === "board"
                  ? "bg-white/10 border-git-green text-white"
                  : "bg-void-grey border-white/10 text-syntax-grey hover:text-white"
              }`}
            >
              Board
            </button>
          </div>
        </div>

        {selectedType === "workspace" && (
          <div className="flex gap-4 items-center">
            <label className="text-sm font-mono text-syntax-grey w-24">
              Workspace
            </label>
            <div className="flex flex-wrap gap-2 flex-1">
              {contexts.workspaces.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedId(w.id)}
                  className={`px-3 py-1.5 text-xs font-mono transition-colors border rounded-full ${
                    selectedId === w.id
                      ? "bg-git-green/20 border-git-green text-git-green"
                      : "bg-obsidian-night border-white/10 text-syntax-grey hover:text-white"
                  }`}
                >
                  {w.name}
                </button>
              ))}
              {contexts.workspaces.length === 0 && (
                <span className="text-syntax-grey text-sm">
                  No workspaces available
                </span>
              )}
            </div>
          </div>
        )}

        {selectedType === "board" && (
          <div className="flex gap-4 items-center">
            <label className="text-sm font-mono text-syntax-grey w-24">
              Board
            </label>
            <div className="flex flex-wrap gap-2 flex-1">
              {contexts.boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className={`px-3 py-1.5 text-xs font-mono transition-colors border rounded-full ${
                    selectedId === b.id
                      ? "bg-git-green/20 border-git-green text-git-green"
                      : "bg-obsidian-night border-white/10 text-syntax-grey hover:text-white"
                  }`}
                >
                  {b.name}
                </button>
              ))}
              {contexts.boards.length === 0 && (
                <span className="text-syntax-grey text-sm">
                  No boards available
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedType && selectedId && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="email"
              className="flex-1 p-2 bg-obsidian-night border border-white/10 text-white rounded text-sm outline-none focus:border-git-green transition-colors"
              placeholder="Add member by email..."
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
            />
            <button
              onClick={handleAddMember}
              disabled={adding || !newMemberEmail}
              className="px-4 py-2 bg-git-green text-black font-semibold rounded hover:bg-git-green/80 disabled:opacity-50 text-sm transition-colors"
            >
              {adding ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-syntax-grey">Loading members...</p>}

      {!loading && selectedType && selectedId && (
        <div className="flex flex-col gap-4 mt-4 border border-white/10 rounded overflow-hidden">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex justify-between items-center p-4 border-b border-white/10 last:border-0 bg-white/5"
            >
              <div className="flex flex-col">
                <span className="text-white font-medium">
                  {member.name || "Unknown User"}
                </span>
                <span className="text-syntax-grey text-xs">{member.email}</span>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  className="p-1.5 bg-obsidian-night border border-white/10 text-white text-xs rounded"
                  value={member.role}
                  onChange={(e) =>
                    handleRoleChange(member.id, e.target.value as Role)
                  }
                >
                  <option value="MEMBER">Member</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {member.id !== userId && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="px-2 py-1.5 text-xs bg-git-red/20 text-git-red rounded hover:bg-git-red/40 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="p-4 text-syntax-grey">No members found.</div>
          )}
        </div>
      )}
    </div>
  );
}
