"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import FolderCard from "@/components/folders/FolderCard";
import FileCard from "@/components/files/FileCard";
import FileUpload from "@/components/files/FileUpload";
import PreviewEngine from "@/components/preview/PreviewEngine";
import Button from "@/components/ui/Button";
import SharedBadge from "@/components/ui/SharedBadge";
import Modal from "@/components/ui/Modal";
import { formatFileSize } from "@/lib/utils";
import { Grid, List, Upload, Plus, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface SpaceData {
  id: string;
  name: string;
  quotaBytes: number;
  usedBytes: number;
  members: { id: string; user: { id: string; name: string | null; username: string | null } }[];
  folders: { id: string; name: string; parentId: string | null }[];
}

interface FileData {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  folderId?: string | null;
}

interface FolderData {
  id: string;
  name: string;
  parentId: string | null;
  sharedSpaceId?: string | null;
  _count?: { files: number; children: number };
  createdAt: string;
}

export default function SharedSpacePage() {
  const params = useParams();
  const id = params.id as string;

  const [space, setSpace] = useState<SpaceData | null>(null);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [spaceRes, foldersRes, filesRes] = await Promise.all([
        fetch(`/api/shared-spaces/${id}`),
        fetch(`/api/folders?sharedSpaceId=${id}&parentId=${currentFolderId || "root"}`),
        currentFolderId ? fetch(`/api/files?folderId=${currentFolderId}`) : Promise.resolve(null),
      ]);
      if (spaceRes.ok) setSpace(await spaceRes.json());
      if (foldersRes.ok) setFolders(await foldersRes.json());
      if (filesRes?.ok) setFiles(await filesRes.json());
      else setFiles([]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id, currentFolderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim(), sharedSpaceId: id, parentId: currentFolderId || null }),
    });
    if (res.ok) {
      toast.success("Dossier créé");
      setShowCreateFolder(false);
      setNewFolderName("");
      fetchData();
    } else {
      toast.error("Erreur");
    }
  };

  const percent = space ? Math.min(Math.round((space.usedBytes / space.quotaBytes) * 100), 100) : 0;

  const inputClasses = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none mb-4";

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-x-hidden">
        {/* Space header */}
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {space?.name || "Espace partagé"}
              </h1>
              <SharedBadge />
            </div>
          </div>

          {space && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{space.members.length} membre(s)</span>
                <span>{formatFileSize(space.usedBytes)} / {formatFileSize(space.quotaBytes)}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${percent > 90 ? "bg-red-500" : percent > 70 ? "bg-yellow-500" : "bg-purple-500"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="px-4 lg:px-6 py-3 border-b border-gray-200 dark:border-white/10 flex items-center gap-2 justify-end">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
            <button onClick={() => setViewMode("grid")} className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded transition-colors ${viewMode === "grid" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-400"}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded transition-colors ${viewMode === "list" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm" : "text-gray-400"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowCreateFolder(true)}>
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Dossier</span>
          </Button>
          <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
            <Upload className="w-4 h-4" /><span className="hidden sm:inline">Upload</span>
          </Button>
        </div>

        {/* Upload */}
        <AnimatePresence>
          {showUpload && currentFolderId && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-4 lg:px-6 pt-4">
              <FileUpload folderId={currentFolderId} onUploadComplete={fetchData} />
            </motion.div>
          )}
          {showUpload && !currentFolderId && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-4 lg:px-6 pt-4">
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded-lg px-4 py-3">
                Ouvre un dossier pour uploader des fichiers dans cet espace.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-auto px-4 lg:px-6 py-4">
          {currentFolderId && (
            <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
              ← Retour à l&apos;espace
            </button>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {folders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Dossiers</h3>
                  <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-1"}>
                    {folders.map((folder) => (
                      <FolderCard key={folder.id} folder={folder} onRefresh={fetchData} viewMode={viewMode} />
                    ))}
                  </div>
                </div>
              )}
              {files.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Fichiers ({files.length})</h3>
                  <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-1"}>
                    {files.map((file) => (
                      <FileCard key={file.id} file={file} onPreview={setPreviewFile} onRefresh={fetchData} viewMode={viewMode} />
                    ))}
                  </div>
                </div>
              )}
              {folders.length === 0 && files.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Espace vide. Créez un dossier pour commencer.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create folder modal */}
      <Modal isOpen={showCreateFolder} onClose={() => { setShowCreateFolder(false); setNewFolderName(""); }} title="Nouveau dossier">
        <input
          type="text"
          placeholder="Nom du dossier"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          className={inputClasses}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => { setShowCreateFolder(false); setNewFolderName(""); }}>Annuler</Button>
          <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Créer</Button>
        </div>
      </Modal>

      {/* Preview */}
      {previewFile && (
        <PreviewEngine file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </AppShell>
  );
}
