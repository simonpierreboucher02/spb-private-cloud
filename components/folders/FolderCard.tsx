"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface FolderData {
  id: string;
  name: string;
  _count?: { files: number; children: number };
}

interface FolderCardProps {
  folder: FolderData;
  onRefresh: () => void;
  viewMode: "grid" | "list";
}

export default function FolderCard({ folder, onRefresh, viewMode }: FolderCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [renameModal, setRenameModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleRename = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        toast.success("Dossier renommé");
        onRefresh();
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
      setRenameModal(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Dossier supprimé");
        onRefresh();
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setLoading(false);
      setDeleteModal(false);
    }
  };

  const inputClasses = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none mb-4";

  if (viewMode === "list") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 px-3 py-3.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
          onClick={() => router.push(`/dashboard/folder/${folder.id}`)}
        >
          <Folder className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">{folder.name}</span>
          {folder._count && (
            <span className="text-xs text-gray-500">
              {folder._count.files} fichiers
            </span>
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 py-1 max-h-[70vh] overflow-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenameModal(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <Pencil className="w-4 h-4" /> Renommer
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModal(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </div>
            )}
          </div>
        </motion.div>
        <Modal isOpen={renameModal} onClose={() => setRenameModal(false)} title="Renommer le dossier">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClasses} autoFocus />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setRenameModal(false)}>Annuler</Button>
            <Button onClick={handleRename} loading={loading}>Renommer</Button>
          </div>
        </Modal>
        <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Supprimer le dossier">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Supprimer <strong className="text-gray-900 dark:text-white">{folder.name}</strong> et tout son contenu ?</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete} loading={loading}>Supprimer</Button>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="group bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-500/30 transition-colors cursor-pointer relative shadow-sm dark:shadow-none min-h-[72px]"
        onClick={() => router.push(`/dashboard/folder/${folder.id}`)}
      >
        <div className="flex items-center gap-3">
          <Folder className="w-8 h-8 text-blue-400" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{folder.name}</p>
            {folder._count && (
              <p className="text-xs text-gray-500">
                {folder._count.files} fichiers, {folder._count.children} dossiers
              </p>
            )}
          </div>
        </div>

        <div className="absolute top-2 right-2" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 py-1 max-h-[70vh] overflow-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameModal(true);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <Pencil className="w-4 h-4" /> Renommer
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteModal(true);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <Modal isOpen={renameModal} onClose={() => setRenameModal(false)} title="Renommer le dossier">
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClasses} autoFocus />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setRenameModal(false)}>Annuler</Button>
          <Button onClick={handleRename} loading={loading}>Renommer</Button>
        </div>
      </Modal>
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Supprimer le dossier">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Supprimer <strong className="text-gray-900 dark:text-white">{folder.name}</strong> et tout son contenu ?</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>Supprimer</Button>
        </div>
      </Modal>
    </>
  );
}
