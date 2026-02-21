"use client";

import { useState, useEffect } from "react";
import { Users, Check, Search } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface UserOption {
  id: string;
  name: string | null;
  username: string | null;
}

interface CreateSharedFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const inputClasses =
  "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500";

export default function CreateSharedFolderModal({
  isOpen,
  onClose,
  onCreated,
}: CreateSharedFolderModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingUsers(true);
    fetch("/api/users/public")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .finally(() => setLoadingUsers(false));
  }, [isOpen]);

  const handleClose = () => {
    setName("");
    setSelectedIds([]);
    setUserSearch("");
    onClose();
  };

  const toggleUser = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/shared-spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), memberIds: selectedIds }),
      });

      if (res.ok) {
        const space = await res.json();
        toast.success(`Dossier partagé "${name}" créé`);
        handleClose();
        onCreated();
        // Navigate to the new shared space
        router.push(`/dashboard/shared-space/${space.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q)
    );
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nouveau dossier partagé">
      {/* Name */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Nom du dossier
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Ex: Projet Alpha, Famille..."
          className={inputClasses}
          autoFocus
        />
      </div>

      {/* User picker */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Partager avec
          {selectedIds.length > 0 && (
            <span className="ml-auto text-purple-600 dark:text-purple-400 font-semibold">
              {selectedIds.length} sélectionné(s)
            </span>
          )}
        </label>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-6 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 dark:border-white/20 border-t-purple-500 rounded-full animate-spin mr-2" />
            Chargement des utilisateurs...
          </div>
        ) : users.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            Aucun autre utilisateur disponible.
          </p>
        ) : (
          <div className="border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
            {/* Search within users */}
            {users.length > 4 && (
              <div className="p-2 border-b border-gray-100 dark:border-white/10 relative">
                <Search className="w-3.5 h-3.5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filtrer les utilisateurs..."
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded focus:outline-none text-gray-900 dark:text-white"
                />
              </div>
            )}

            <div className="max-h-44 overflow-auto">
              {filteredUsers.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">Aucun résultat</p>
              )}
              {filteredUsers.map((u) => {
                const isSelected = selectedIds.includes(u.id);
                const displayName = u.name || u.username || u.id;
                const initial = displayName[0].toUpperCase();
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-gray-50 dark:border-white/5 last:border-0 ${
                      isSelected
                        ? "bg-purple-50 dark:bg-purple-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                      isSelected
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                    }`}>
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      {u.name && <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}</p>}
                      <p className={`text-xs truncate ${u.name ? "text-gray-400" : "text-sm font-medium text-gray-900 dark:text-white"}`}>
                        @{u.username}
                      </p>
                    </div>

                    {/* Checkbox indicator */}
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-purple-500 border-purple-500"
                        : "border-gray-300 dark:border-white/20"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Info note */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 flex items-start gap-1.5">
        <span className="text-purple-400 mt-0.5">ℹ</span>
        Vous serez automatiquement membre. Le dossier apparaîtra dans la sidebar de chaque membre.
      </p>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={handleClose}>
          Annuler
        </Button>
        <Button
          onClick={handleCreate}
          loading={loading}
          disabled={!name.trim()}
        >
          <Users className="w-4 h-4" />
          Créer le dossier partagé
        </Button>
      </div>
    </Modal>
  );
}
