"use client";

import { useState, useEffect, useMemo } from "react";
import { File, Folder, Download, Eye, ChevronRight, ChevronDown, Archive } from "lucide-react";
import type { PreviewPluginProps } from "./types";
import { formatFileSize } from "@/lib/utils";

interface ArchiveEntry {
  name: string;
  path: string;
  size: number;
  compressedSize: number;
  isDirectory: boolean;
  date: Date | null;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  date: Date | null;
  children: TreeNode[];
}

export default function ArchivePreview({ file }: PreviewPluginProps) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [zipInstance, setZipInstance] = useState<any>(null);

  useEffect(() => {
    const loadArchive = async () => {
      try {
        const JSZip = (await import("jszip")).default;
        const response = await fetch(`/api/files/${file.id}/preview`);
        const buffer = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        setZipInstance(zip);

        const items: ArchiveEntry[] = [];
        zip.forEach((relativePath, zipEntry) => {
          items.push({
            name: zipEntry.name.split("/").filter(Boolean).pop() || zipEntry.name,
            path: relativePath,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            size: (zipEntry as any)._data?.uncompressedSize || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            compressedSize: (zipEntry as any)._data?.compressedSize || 0,
            isDirectory: zipEntry.dir,
            date: zipEntry.date,
          });
        });

        setEntries(items);
        setLoading(false);
      } catch {
        setError("Impossible de lire l'archive");
        setLoading(false);
      }
    };

    loadArchive();
  }, [file.id]);

  const tree = useMemo(() => {
    const root: TreeNode = { name: "", path: "", isDirectory: true, size: 0, date: null, children: [] };

    for (const entry of entries) {
      const parts = entry.path.split("/").filter(Boolean);
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const isLast = i === parts.length - 1;
        let child = current.children.find((c) => c.name === parts[i]);

        if (!child) {
          child = {
            name: parts[i],
            path: parts.slice(0, i + 1).join("/"),
            isDirectory: isLast ? entry.isDirectory : true,
            size: isLast ? entry.size : 0,
            date: isLast ? entry.date : null,
            children: [],
          };
          current.children.push(child);
        }

        current = child;
      }
    }

    // Sort: directories first, then by name
    const sortTree = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortTree);
    };
    sortTree(root);

    return root;
  }, [entries]);

  const handlePreviewFile = async (path: string, name: string) => {
    if (!zipInstance) return;
    try {
      const content = await zipInstance.file(path)?.async("string");
      setPreviewContent(content || "");
      setPreviewName(name);
    } catch {
      setPreviewContent("Impossible de lire ce fichier");
      setPreviewName(name);
    }
  };

  const handleDownloadFile = async (path: string, name: string) => {
    if (!zipInstance) return;
    try {
      const blob = await zipInstance.file(path)?.async("blob");
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Archive className="w-12 h-12 mb-4 text-gray-600" />
        <p>{error}</p>
      </div>
    );
  }

  const fileCount = entries.filter((e) => !e.isDirectory).length;
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 bg-white/5 text-xs text-gray-400">
        <span>{fileCount} fichiers</span>
        <span>{formatFileSize(totalSize)} total</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Tree */}
        <div className="flex-1 overflow-auto p-3">
          {tree.children.map((node) => (
            <TreeNodeView
              key={node.path}
              node={node}
              onPreview={handlePreviewFile}
              onDownload={handleDownloadFile}
            />
          ))}
        </div>

        {/* Preview panel */}
        {previewContent !== null && (
          <div className="w-1/2 border-l border-white/10 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5">
              <span className="text-xs text-gray-400 truncate">{previewName}</span>
              <button
                onClick={() => setPreviewContent(null)}
                className="text-xs text-gray-500 hover:text-white"
              >
                Fermer
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-3 text-xs text-gray-300 font-mono whitespace-pre-wrap">
              {previewContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function TreeNodeView({
  node,
  onPreview,
  onDownload,
}: {
  node: TreeNode;
  onPreview: (path: string, name: string) => void;
  onDownload: (path: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const isTextFile = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return ["txt", "md", "json", "xml", "csv", "js", "ts", "jsx", "tsx", "html", "css", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "yml", "yaml", "toml", "sh", "env", "log", "sql", "conf", "cfg"].includes(ext);
  };

  if (node.isDirectory) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 w-full px-1 py-0.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
          <Folder className="w-4 h-4 text-yellow-500/70" />
          <span>{node.name}</span>
        </button>
        {expanded && (
          <div className="ml-4">
            {node.children.map((child) => (
              <TreeNodeView key={child.path} node={child} onPreview={onPreview} onDownload={onDownload} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group px-1 py-0.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors">
      <div className="w-3" />
      <File className="w-4 h-4 text-gray-500" />
      <span className="flex-1 truncate">{node.name}</span>
      <span className="text-xs text-gray-600 mr-2">{formatFileSize(node.size)}</span>
      <div className="hidden group-hover:flex items-center gap-1">
        {isTextFile(node.name) && (
          <button
            onClick={() => onPreview(node.path, node.name)}
            className="p-1 text-gray-500 hover:text-white transition-colors"
            title="Aperçu"
          >
            <Eye className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => onDownload(node.path, node.name)}
          className="p-1 text-gray-500 hover:text-white transition-colors"
          title="Télécharger"
        >
          <Download className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
