"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, Users, UserPlus, UserMinus } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";
import { formatFileSize } from "@/lib/utils";

interface MemberData {
  id: string;
  user: { id: string; name: string | null; username: string | null };
}

interface SpaceData {
  id: string;
  name: string;
  quotaBytes: number;
  usedBytes: number;
  createdAt: string;
  _count: { members: number; folders: number };
  members: MemberData[];
}

interface UserOption {
  id: string;
  name: string | null;
  username: string | null;
}

const inputClasses = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none mb-4";

export default function SharedSpaceManagement() {
  const [spaces, setSpaces] = useState<SpaceData[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editSpace, setEditSpace] = useState<SpaceData | null>(null);
  const [form, setForm] = useState({ name: "", memberIds: [] as string[] });

  const fetchData = async () => {
    const [spacesRes, usersRes] = await Promise.all([
      fetch("/api/shared-spaces"),
      fetch("/api/users"),
    ]);
    if (spacesRes.ok) setSpaces(await spacesRes.json());
    if (usersRes.ok) setUsers(await usersRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/shared-spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Espace créé");
      setShowCreate(false);
      setForm({ name: "", memberIds: [] });
      fetchData();
    } else {
      toast.error("Erreur lors de la création");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet espace partagé ? Les dossiers seront conservés mais retirés de l'espace.")) return;
    const res = await fetch(`/api/shared-spaces/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Espace supprimé"); fetchData(); }
    else toast.error("Erreur");
  };

  const handleRename = async () => {
    if (!editSpace) return;
    const res = await fetch(`/api/shared-spaces/${editSpace.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editSpace.name }),
    });
    if (res.ok) { toast.success("Renommé"); setEditSpace(null); fetchData(); }
    else toast.error("Erreur");
  };

  const handleAddMember = async (spaceId: string, userId: string) => {
    const res = await fetch(`/api/shared-spaces/${spaceId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) { toast.success("Membre ajouté"); fetchData(); }
    else toast.error("Déjà membre ou erreur");
  };

  const handleRemoveMember = async (spaceId: string, userId: string) => {
    const res = await fetch(`/api/shared-spaces/${spaceId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) { toast.success("Membre retiré"); fetchData(); }
    else toast.error("Erreur");
  };

  const toggleMember = (userId: string) => {
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(userId)
        ? f.memberIds.filter((id) => id !== userId)
        : [...f.memberIds, userId],
    }));
  };

  if (loading) return <div className="text-gray-500 text-sm p-4">Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nouvel espace
        </Button>
      </div>

      {spaces.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun espace partagé. Créez-en un pour commencer.</p>
        </div>
      )}

      <div className="space-y-4">
        {spaces.map((space) => {
          const percent = space.quotaBytes > 0 ? Math.min(Math.round((space.usedBytes / space.quotaBytes) * 100), 100) : 0;
          const memberUserIds = space.members.map((m) => m.user.id);
          const nonMembers = users.filter((u) => !memberUserIds.includes(u.id));

          return (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{space.name}</p>
                    <p className="text-xs text-gray-500">{space._count.members} membre(s) · {space._count.folders} dossier(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditSpace(space)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(space.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Storage quota */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Stockage utilisé</span>
                  <span>{formatFileSize(space.usedBytes)} / {formatFileSize(space.quotaBytes)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${percent > 90 ? "bg-red-500" : percent > 70 ? "bg-yellow-500" : "bg-purple-500"}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{percent}% utilisé</p>
              </div>

              {/* Members */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Membres</p>
                <div className="space-y-1 mb-3">
                  {space.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">
                            {(m.user.name || m.user.username || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{m.user.name || m.user.username}</span>
                      </div>
                      <button onClick={() => handleRemoveMember(space.id, m.user.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {space.members.length === 0 && (
                    <p className="text-xs text-gray-400 px-2">Aucun membre pour l&apos;instant</p>
                  )}
                </div>

                {/* Add member */}
                {nonMembers.length > 0 && (
                  <div className="flex gap-2">
                    <select
                      className="flex-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) { handleAddMember(space.id, e.target.value); e.target.value = ""; }
                      }}
                    >
                      <option value="" disabled>Ajouter un membre...</option>
                      {nonMembers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name || u.username}</option>
                      ))}
                    </select>
                    <button className="p-2 text-purple-500 hover:text-purple-700 transition-colors">
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setForm({ name: "", memberIds: [] }); }} title="Nouvel espace partagé">
        <input
          type="text"
          placeholder="Nom de l'espace"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClasses}
          autoFocus
        />
        {users.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Membres</p>
            <div className="space-y-1 max-h-48 overflow-auto">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.memberIds.includes(u.id)}
                    onChange={() => toggleMember(u.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{u.name || u.username}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400 mb-4">Quota : 500 Go par défaut</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => { setShowCreate(false); setForm({ name: "", memberIds: [] }); }}>Annuler</Button>
          <Button onClick={handleCreate} disabled={!form.name.trim()}>Créer</Button>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editSpace} onClose={() => setEditSpace(null)} title="Modifier l'espace">
        {editSpace && (
          <>
            <input
              type="text"
              value={editSpace.name}
              onChange={(e) => setEditSpace({ ...editSpace, name: e.target.value })}
              className={inputClasses}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setEditSpace(null)}>Annuler</Button>
              <Button onClick={handleRename}>Enregistrer</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
