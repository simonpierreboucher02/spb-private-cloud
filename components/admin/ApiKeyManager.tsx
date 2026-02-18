"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Trash2, Copy, Plus } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", permissions: "read" });

  const fetchKeys = async () => {
    const res = await fetch("/api/keys");
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchKeys(); }, []);

  const createKey = async () => {
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKey(data.key);
      setForm({ name: "", permissions: "read" });
      fetchKeys();
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Supprimer cette clé API ?")) return;
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    toast.success("Clé supprimée");
    fetchKeys();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Clé copiée");
  };

  const inputClasses = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <Key className="w-5 h-5" /> Clés API
        </h2>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Nouvelle clé
        </Button>
      </div>

      <p className="text-xs text-gray-500 break-words">
        Utilisez les clés API pour accéder à l&apos;API REST : <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded inline-block overflow-x-auto max-w-full">GET /api/v1/files</code> avec header <code className="bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded inline-block overflow-x-auto max-w-full">Authorization: Bearer spb_...</code>
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Key className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>Aucune clé API</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((k, i) => (
            <motion.div
              key={k.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <Key className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{k.name}</p>
                  <p className="text-xs text-gray-500 break-all">
                    <code>{k.keyPrefix}...</code> • {k.permissions}
                    {k.lastUsedAt && ` • Dernier usage: ${formatDate(k.lastUsedAt)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteKey(k.id)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors self-end sm:self-auto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setNewKey(null); }} title="Nouvelle clé API">
        {newKey ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Voici votre clé API. Copiez-la maintenant, elle ne sera plus affichée.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 dark:bg-white/10 px-3 py-2 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {newKey}
              </code>
              <button
                onClick={() => copyKey(newKey)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <Button onClick={() => { setShowCreate(false); setNewKey(null); }} className="w-full">
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="text" placeholder="Nom de la clé" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClasses} />
            <select value={form.permissions} onChange={(e) => setForm({ ...form, permissions: e.target.value })} className={inputClasses}>
              <option value="read">Lecture seule</option>
              <option value="write">Lecture + Écriture</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button onClick={createKey} disabled={!form.name}>Créer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
