"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Shield, Edit2, Users } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";

interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  twoFactorEnabled: boolean;
  createdAt: string;
  _count?: { files: number; folders: number };
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "user" });

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Utilisateur créé");
      setShowCreate(false);
      setForm({ email: "", name: "", password: "", role: "user" });
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur");
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    const data: Record<string, string> = {};
    if (form.name) data.name = form.name;
    if (form.email) data.email = form.email;
    if (form.role) data.role = form.role;
    if (form.password) data.password = form.password;

    const res = await fetch(`/api/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Utilisateur modifié");
      setEditUser(null);
      fetchUsers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Utilisateur supprimé");
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || "Erreur");
    }
  };

  const inputClasses = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-gray-400 dark:focus:border-white/20";

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    user: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    viewer: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5" /> Utilisateurs
        </h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl transition-colors"
            >
              {/* First line: avatar + name/email */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 flex-shrink-0">
                  {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name || user.email || user.id}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              {/* Second line on mobile: role badge + file count + actions */}
              <div className="flex items-center gap-2 sm:gap-3 pl-13 sm:pl-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || roleColors.user}`}>
                  {user.role}
                </span>
                {user.twoFactorEnabled && (
                  <Shield className="w-4 h-4 text-green-500 flex-shrink-0" title="2FA activé" />
                )}
                <span className="text-xs text-gray-500 hidden sm:block">
                  {user._count?.files || 0} fichiers
                </span>
                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={() => { setEditUser(user); setForm({ email: user.email || "", name: user.name || "", password: "", role: user.role }); }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouvel utilisateur">
        <div className="space-y-3">
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClasses} />
          <input type="text" placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
          <input type="password" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClasses} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClasses}>
            <option value="user">Utilisateur</option>
            <option value="viewer">Lecteur</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreate}>Créer</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Modifier utilisateur">
        <div className="space-y-3">
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClasses} />
          <input type="text" placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
          <input type="password" placeholder="Nouveau mot de passe (vide = inchangé)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClasses} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClasses}>
            <option value="user">Utilisateur</option>
            <option value="viewer">Lecteur</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setEditUser(null)}>Annuler</Button>
            <Button onClick={handleUpdate}>Sauvegarder</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
