"use client";

import { useState, useEffect, useCallback } from "react";
import { Grid, List, Plus, Upload, CheckSquare, Square, Users } from "lucide-react";
import FileCard from "./FileCard";
import FileUpload from "./FileUpload";
import PreviewEngine from "../preview/PreviewEngine";
import FolderCard from "../folders/FolderCard";
import CreateFolderModal from "../folders/CreateFolderModal";
import CreateSharedFolderModal from "../folders/CreateSharedFolderModal";
import SearchBar from "../ui/SearchBar";
import Button from "../ui/Button";
import BulkActions from "./BulkActions";
import { motion, AnimatePresence } from "framer-motion";

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
  createdAt: string;
  _count?: { files: number; children: number };
}

interface FileExplorerProps {
  folderId?: string | null;
}

export default function FileExplorer({ folderId }: FileExplorerProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateSharedFolder, setShowCreateSharedFolder] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (folderId) params.set("folderId", folderId);
      else params.set("folderId", "root");
      if (searchQuery) params.set("search", searchQuery);

      const [filesRes, foldersRes] = await Promise.all([
        fetch(`/api/files?${params}`),
        fetch(`/api/folders?parentId=${folderId || "root"}`),
      ]);

      if (filesRes.ok) setFiles(await filesRes.json());
      if (foldersRes.ok) setFolders(await foldersRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [folderId, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = useCallback((query: string) => { setSearchQuery(query); }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === files.length) setSelectedIds([]);
    else setSelectedIds(files.map((f) => f.id));
  };

  const handleFileClick = (file: FileData) => {
    if (selectMode) {
      toggleSelect(file.id);
    } else {
      setPreviewFile(file);
    }
  };

  return (
    <div className="flex flex-col h-full lg:flex-row overflow-x-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Toolbar */}
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <SearchBar onSearch={handleSearch} placeholder="Rechercher des fichiers..." />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded transition-colors ${viewMode === "grid" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-none" : "text-gray-400"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded transition-colors ${viewMode === "list" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm dark:shadow-none" : "text-gray-400"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button
              variant={selectMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => { setSelectMode(!selectMode); setSelectedIds([]); }}
              className="min-w-[40px] min-h-[40px]"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Sélection</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateFolder(true)} className="min-w-[40px] min-h-[40px]">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Dossier</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateSharedFolder(true)} className="min-w-[40px] min-h-[40px] text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Partagé</span>
            </Button>
            <Button size="sm" onClick={() => setShowUpload(!showUpload)} className="min-w-[40px] min-h-[40px]">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <BulkActions selectedIds={selectedIds} onClear={() => { setSelectedIds([]); setSelectMode(false); }} onRefresh={fetchData} />

        {/* Select All */}
        {selectMode && files.length > 0 && (
          <div className="px-4 lg:px-6 py-2 border-b border-gray-100 dark:border-white/5">
            <button onClick={selectAll} className="flex items-center gap-2 text-sm sm:text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 min-h-[40px]">
              {selectedIds.length === files.length ? <CheckSquare className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Square className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
              {selectedIds.length === files.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>
        )}

        {/* Upload Zone */}
        <AnimatePresence>
          {showUpload && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-4 lg:px-6 pt-4">
              <FileUpload folderId={folderId} onUploadComplete={fetchData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="flex-1 overflow-auto overflow-x-hidden px-4 lg:px-6 py-4">
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
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Fichiers ({files.length})
                  </h3>
                  <div className={viewMode === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-1"}>
                    {files.map((file) => (
                      <div key={file.id} className="relative">
                        {selectMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                            className="absolute top-2 left-2 z-10 p-1.5 bg-white/80 dark:bg-black/50 rounded-md backdrop-blur-sm min-w-[36px] min-h-[36px] flex items-center justify-center"
                          >
                            {selectedIds.includes(file.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-500" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                        <div className={selectedIds.includes(file.id) ? "ring-2 ring-blue-500 rounded-xl" : ""}>
                          <FileCard
                            file={file}
                            onPreview={handleFileClick}
                            onRefresh={fetchData}
                            viewMode={viewMode}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {folders.length === 0 && files.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <Upload className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg">Aucun fichier</p>
                  <p className="text-sm mt-1">Uploadez vos premiers fichiers</p>
                  <Button className="mt-4" size="sm" onClick={() => setShowUpload(true)}>
                    <Upload className="w-4 h-4" /> Upload
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:w-[400px] lg:border-l lg:border-gray-200 dark:lg:border-white/10">
          <PreviewEngine file={previewFile} files={files} onClose={() => setPreviewFile(null)} onNavigate={setPreviewFile} />
        </div>
      )}

      <CreateFolderModal isOpen={showCreateFolder} onClose={() => setShowCreateFolder(false)} parentId={folderId || null} onCreated={fetchData} />
      <CreateSharedFolderModal isOpen={showCreateSharedFolder} onClose={() => setShowCreateSharedFolder(false)} onCreated={fetchData} />
    </div>
  );
}
