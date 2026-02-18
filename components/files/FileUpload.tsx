"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface UploadItem {
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface FileUploadProps {
  folderId?: string | null;
  onUploadComplete: () => void;
}

export default function FileUpload({ folderId, onUploadComplete }: FileUploadProps) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folderId) formData.append("folderId", folderId);

      setUploads((prev) => [
        ...prev,
        { file, progress: 0, status: "uploading" },
      ]);

      try {
        const res = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        setUploads((prev) =>
          prev.map((u) =>
            u.file === file ? { ...u, progress: 100, status: "done" } : u
          )
        );
        onUploadComplete();
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file
              ? { ...u, status: "error", error: (err as Error).message }
              : u
          )
        );
      }
    },
    [folderId, onUploadComplete]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => uploadFile(file));
    },
    [uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
  });

  const clearUploads = () => setUploads([]);

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/5"
            : "border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isDragActive
            ? "Déposez les fichiers ici..."
            : (
              <>
                <span className="hidden sm:inline">Glissez-déposez vos fichiers ou cliquez pour sélectionner</span>
                <span className="sm:hidden">Tapez pour sélectionner des fichiers</span>
              </>
            )}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
          Max {formatFileSize(parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "104857600"))}
        </p>
      </div>

      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {uploads.filter((u) => u.status === "done").length}/{uploads.length} terminé
              </span>
              <button onClick={clearUploads} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 min-h-[36px] px-2">
                Effacer
              </button>
            </div>
            {uploads.map((upload, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-3 sm:py-2"
              >
                {upload.status === "uploading" && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
                {upload.status === "done" && (
                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                )}
                {upload.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">
                  {upload.file.name}
                </span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatFileSize(upload.file.size)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
