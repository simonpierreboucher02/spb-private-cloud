"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link2, Link2Off, Trash2, Copy, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface SharedLink {
  id: string;
  token: string;
  mode: string;
  active: boolean;
  expiresAt: string | null;
  passwordHash: string | null;
  createdAt: string;
  file: { name: string; mimeType: string; size: number } | null;
}

export default function SharesPage() {
  const [shares, setShares] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shares");
      if (res.ok) setShares(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const toggleActive = async (id: string, active: boolean) => {
    await fetch(`/api/shares/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    fetchShares();
    toast.success(active ? "Lien désactivé" : "Lien activé");
  };

  const deleteShare = async (id: string) => {
    await fetch(`/api/shares/${id}`, { method: "DELETE" });
    fetchShares();
    toast.success("Lien supprimé");
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`);
    toast.success("Lien copié");
  };

  return (
    <AppShell>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Liens partagés</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos liens de partage
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
          </div>
        ) : shares.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Link2 className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>Aucun lien de partage</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map((share, i) => (
              <motion.div
                key={share.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white dark:bg-white/5 border rounded-xl p-3.5 sm:p-4 shadow-sm dark:shadow-none transition-colors ${
                  share.active ? "border-gray-200 dark:border-white/10" : "border-gray-100 dark:border-white/5 opacity-60"
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {share.file?.name || "Fichier supprimé"}
                    </p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                      <span className="text-xs text-gray-500">
                        {share.mode === "DOWNLOAD" ? "Téléchargement" : "Aperçu"}
                      </span>
                      {share.passwordHash && (
                        <span className="text-xs text-yellow-500">Protégé</span>
                      )}
                      {share.expiresAt && (
                        <span className="text-xs text-gray-500 break-words">
                          Expire: {formatDate(share.expiresAt)}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-600 break-words">
                        Créé: {formatDate(share.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(share.token)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-xs sm:hidden">Copier</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(`/shared/${share.token}`, "_blank")
                      }
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(share.id, share.active)}
                    >
                      {share.active ? (
                        <Link2Off className="w-3.5 h-3.5" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteShare(share.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
