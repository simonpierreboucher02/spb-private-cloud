"use client";

import { useState } from "react";
import { Trash2, FolderInput, Download, Lock, Unlock, X, Sparkles } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";

interface BulkActionsProps {
  selectedIds: string[];
  onClear: () => void;
  onRefresh: () => void;
}

export default function BulkActions({ selectedIds, onClear, onRefresh }: BulkActionsProps) {
  const [moveModal, setMoveModal] = useState(false);
  const [folders, setFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  const bulkAction = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/files/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, fileIds: selectedIds, ...extra }),
      });

      if (action === "download" && res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "files.zip";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Téléchargement lancé");
      } else if (res.ok) {
        const data = await res.json();
        toast.success(`Action terminée (${data.count || selectedIds.length} fichiers)`);
        onRefresh();
        onClear();
      } else {
        toast.error("Erreur");
      }
    } catch {
      toast.error("Erreur");
    }
    setLoading(false);
  };

  const openMoveModal = async () => {
    const res = await fetch("/api/folders?tree=true");
    if (res.ok) setFolders(await res.json());
    setMoveModal(true);
  };

  const handleMove = async (targetFolderId: string) => {
    await bulkAction("move", { targetFolderId });
    setMoveModal(false);
  };

  const aiTagAll = async () => {
    setLoading(true);
    for (const id of selectedIds) {
      try {
        await fetch("/api/ai/tag", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: id }),
        });
      } catch {}
    }
    toast.success("Tags IA générés");
    setLoading(false);
    onRefresh();
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border-b border-blue-200 dark:border-blue-500/20 overflow-x-auto">
        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap flex-shrink-0">
          {selectedIds.length} sélectionné{selectedIds.length > 1 ? "s" : ""}
        </span>
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-1.5 flex-nowrap flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={() => bulkAction("download")} loading={loading} className="min-h-[40px] whitespace-nowrap">
            <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">ZIP</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={openMoveModal} className="min-h-[40px] whitespace-nowrap">
            <FolderInput className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Déplacer</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => bulkAction("encrypt")} loading={loading} className="min-h-[40px] whitespace-nowrap">
            <Lock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Chiffrer</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => bulkAction("decrypt")} loading={loading} className="min-h-[40px] whitespace-nowrap">
            <Unlock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Déchiffrer</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={aiTagAll} loading={loading} className="min-h-[40px] whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Tags IA</span>
          </Button>
          <Button size="sm" variant="danger" onClick={() => { if (confirm(`Supprimer ${selectedIds.length} fichier(s) ?`)) bulkAction("delete"); }} loading={loading} className="min-h-[40px] whitespace-nowrap">
            <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Supprimer</span>
          </Button>
        </div>
        <button onClick={onClear} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <Modal isOpen={moveModal} onClose={() => setMoveModal(false)} title="Déplacer vers">
        <div className="space-y-1 max-h-60 overflow-y-auto">
          <button onClick={() => handleMove("root")} className="w-full text-left px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
            Racine
          </button>
          {folders.map((f: { id: string; name: string }) => (
            <button key={f.id} onClick={() => handleMove(f.id)} className="w-full text-left px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
              {f.name}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
