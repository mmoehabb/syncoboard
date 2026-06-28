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

export function MemberManagement() {
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

  useEffect(() => {
    getAdminContexts().then(setContexts);
  }, []);

  useEffect(() => {
    if (selectedType && selectedId) {
      setLoading(true);
      setError(null);
      getMembers(selectedType, selectedId)
        .then(setMembers)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setMembers([]);
    }
  }, [selectedType, selectedId]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!selectedType || !selectedId) return;
    try {
      await updateMemberRole(selectedType, selectedId, userId, newRole);
      const updated = await getMembers(selectedType, selectedId);
      setMembers(updated);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!selectedType || !selectedId) return;
    if (confirm("Are you sure you want to remove this member?")) {
      try {
        await removeMember(selectedType, selectedId, userId);
        const updated = await getMembers(selectedType, selectedId);
        setMembers(updated);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  const handleAddMember = async () => {
    if (!selectedType || !selectedId || !newMemberEmail) return;
    setAdding(true);
    setError(null);
    try {
      await addMemberByEmail(selectedType, selectedId, newMemberEmail);
      const updated = await getMembers(selectedType, selectedId);
      setMembers(updated);
      setNewMemberEmail("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white">Member Management</h2>
        <p className="text-sm text-syntax-grey">
          Manage members for boards and workspaces where you are an ADMIN.
        </p>
      </div>

      <div className="flex gap-4 items-center">
        <select
          className="p-2 bg-void-grey border border-white/10 text-white rounded text-sm outline-none"
          value={selectedType || ""}
          onChange={(e) => {
            setSelectedType(e.target.value as "workspace" | "board");
            setSelectedId("");
          }}
        >
          <option value="" disabled>
            Select Type
          </option>
          <option value="workspace">Workspace</option>
          <option value="board">Board</option>
        </select>

        {selectedType === "workspace" && (
          <select
            className="p-2 bg-void-grey border border-white/10 text-white rounded text-sm outline-none"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="" disabled>
              Select Workspace
            </option>
            {contexts.workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        )}

        {selectedType === "board" && (
          <select
            className="p-2 bg-void-grey border border-white/10 text-white rounded text-sm outline-none"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="" disabled>
              Select Board
            </option>
            {contexts.boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <div className="text-git-red text-sm">{error}</div>}

      {selectedType && selectedId && (
        <div className="flex gap-2">
          <input
            type="email"
            className="flex-1 p-2 bg-obsidian-night border border-white/10 text-white rounded text-sm outline-none"
            placeholder="Add member by email..."
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
          />
          <button
            onClick={handleAddMember}
            disabled={adding || !newMemberEmail}
            className="px-4 py-2 bg-git-green text-black font-semibold rounded hover:bg-git-green/80 disabled:opacity-50 text-sm"
          >
            {adding ? "Adding..." : "Add"}
          </button>
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
                <button
                  onClick={() => handleRemove(member.id)}
                  className="px-2 py-1.5 text-xs bg-git-red/20 text-git-red rounded hover:bg-git-red/40 transition-colors"
                >
                  Remove
                </button>
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
