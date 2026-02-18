"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Pencil,
  Trash2,
  Copy,
  Share2,
  FolderInput,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface FileData {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  folderId?: string | null;
}

interface FileActionsProps {
  file: FileData;
  onClose: () => void;
  onRefresh: () => void;
}

export default function FileActions({ file, onClose, onRefresh }: FileActionsProps) {
  const [renameModal, setRenameModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [moveModal, setMoveModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpiry, setShareExpiry] = useState("");
  const [shareMode, setShareMode] = useState<"DOWNLOAD" | "PREVIEW">("DOWNLOAD");
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);

  const handleDownload = () => {
    window.open(`/api/files/${file.id}/download`, "_blank");
    onClose();
  };

  const handleRename = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        toast.success("Fichier renommé");
        onRefresh();
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
      setRenameModal(false);
      onClose();
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/files/${file.id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Fichier dupliqué");
        onRefresh();
      }
    } catch {
      toast.error("Erreur");
    }
    onClose();
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Fichier supprimé");
        onRefresh();
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
      setDeleteModal(false);
      onClose();
    }
  };

  const [shareLink, setShareLink] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for non-HTTPS contexts
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file.id,
          password: sharePassword || undefined,
          expiresAt: shareExpiry || undefined,
          mode: shareMode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const url = `${window.location.origin}/shared/${data.token}`;
        setShareLink(url);
        const copied = await copyToClipboard(url);
        if (copied) {
          toast.success("Lien copié dans le presse-papiers");
        } else {
          toast.success("Lien de partage créé");
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors du partage");
      }
    } catch (err) {
      toast.error("Erreur réseau: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (targetFolderId: string) => {
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: targetFolderId }),
      });
      if (res.ok) {
        toast.success("Fichier déplacé");
        onRefresh();
      }
    } catch {
      toast.error("Erreur");
    }
    setMoveModal(false);
    onClose();
  };

  const loadFolders = async () => {
    const res = await fetch("/api/folders?tree=true");
    if (res.ok) {
      const data = await res.json();
      setFolders(data);
    }
  };

  const actions = [
    { icon: Download, label: "Télécharger", action: handleDownload },
    { icon: Pencil, label: "Renommer", action: () => setRenameModal(true) },
    { icon: Copy, label: "Dupliquer", action: handleDuplicate },
    {
      icon: FolderInput,
      label: "Déplacer",
      action: () => {
        loadFolders();
        setMoveModal(true);
      },
    },
    { icon: Share2, label: "Partager", action: () => setShareModal(true) },
    { icon: Trash2, label: "Supprimer", action: () => setDeleteModal(true), danger: true },
  ];

  const inputClasses = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-gray-400 dark:focus:border-white/20";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden max-h-[70vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={(e) => {
              e.stopPropagation();
              action.action();
            }}
            className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors ${
              (action as { danger?: boolean }).danger
                ? "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
            }`}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </motion.div>

      {/* Rename Modal */}
      <Modal isOpen={renameModal} onClose={() => setRenameModal(false)} title="Renommer">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={`${inputClasses} mb-4`}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setRenameModal(false)}>Annuler</Button>
          <Button onClick={handleRename} loading={loading}>Renommer</Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Supprimer">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
          Supprimer <strong className="text-gray-900 dark:text-white">{file.name}</strong> ? Cette action est irréversible.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>Supprimer</Button>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal isOpen={shareModal} onClose={() => { setShareModal(false); setShareLink(null); onClose(); }} title="Partager">
        {shareLink ? (
          <div className="space-y-4">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Lien de partage créé !</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className={`${inputClasses} text-xs font-mono`}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="sm"
                onClick={() => {
                  copyToClipboard(shareLink);
                  toast.success("Lien copié !");
                }}
              >
                Copier
              </Button>
            </div>
            <Button variant="ghost" onClick={() => { setShareModal(false); setShareLink(null); onClose(); }} className="w-full">
              Fermer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Mode</label>
              <select
                value={shareMode}
                onChange={(e) => setShareMode(e.target.value as "DOWNLOAD" | "PREVIEW")}
                className={inputClasses}
              >
                <option value="DOWNLOAD">Téléchargement</option>
                <option value="PREVIEW">Aperçu seulement</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Mot de passe (optionnel)</label>
              <input
                type="password"
                value={sharePassword}
                onChange={(e) => setSharePassword(e.target.value)}
                placeholder="Laisser vide pour pas de mot de passe"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Expiration (optionnel)</label>
              <input
                type="datetime-local"
                value={shareExpiry}
                onChange={(e) => setShareExpiry(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setShareModal(false); onClose(); }}>Annuler</Button>
              <Button onClick={handleShare} loading={loading}>Créer le lien</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Move Modal */}
      <Modal isOpen={moveModal} onClose={() => setMoveModal(false)} title="Déplacer vers">
        <div className="space-y-1 max-h-60 overflow-y-auto">
          <button
            onClick={() => handleMove("root")}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
          >
            Racine
          </button>
          {folders.map((folder: { id: string; name: string }) => (
            <button
              key={folder.id}
              onClick={() => handleMove(folder.id)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
            >
              {folder.name}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
