"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, FileText, Tag } from "lucide-react";
import TagSelector from "@/components/tags/TagSelector";
import type { FileData } from "@/types/files";
import toast from "react-hot-toast";

interface MetadataEditorProps {
  file: FileData;
  onUpdate?: () => void;
}

export default function MetadataEditor({ file, onUpdate }: MetadataEditorProps) {
  const [description, setDescription] = useState(file.metadata?.description || "");
  const [isFavorite, setIsFavorite] = useState(file.metadata?.isFavorite || false);
  const [tags, setTags] = useState(file.tags || []);
  const [, setSaving] = useState(false);

  const loadMetadata = useCallback(async () => {
    try {
      const [metaRes, tagsRes] = await Promise.all([
        fetch(`/api/files/${file.id}/metadata`),
        fetch(`/api/files/${file.id}/tags`),
      ]);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        setDescription(meta.description || "");
        setIsFavorite(meta.isFavorite);
      }
      if (tagsRes.ok) {
        setTags(await tagsRes.json());
      }
    } catch {}
  }, [file.id]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const saveDescription = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/files/${file.id}/metadata`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      toast.success("Description sauvegardée");
      onUpdate?.();
    } catch {
      toast.error("Erreur");
    }
    setSaving(false);
  }, [file.id, description, onUpdate]);

  const toggleFavorite = useCallback(async () => {
    try {
      const res = await fetch(`/api/files/${file.id}/favorite`, { method: "POST" });
      if (res.ok) {
        const meta = await res.json();
        setIsFavorite(meta.isFavorite);
        onUpdate?.();
      }
    } catch {}
  }, [file.id, onUpdate]);

  return (
    <div className="p-4 space-y-4 border-t border-white/10">
      {/* Favorite */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" />
          Favori
        </span>
        <button
          onClick={toggleFavorite}
          className="p-1 transition-colors"
        >
          <Star
            className={`w-5 h-5 ${
              isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-600 hover:text-yellow-400"
            }`}
          />
        </button>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-gray-400 flex items-center gap-1.5 mb-1.5">
          <FileText className="w-3.5 h-3.5" />
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          placeholder="Ajouter une description..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder:text-gray-600 resize-none focus:outline-none focus:border-white/20"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs text-gray-400 flex items-center gap-1.5 mb-1.5">
          <Tag className="w-3.5 h-3.5" />
          Tags
        </label>
        <TagSelector
          fileId={file.id}
          currentTags={tags}
          onTagsChange={loadMetadata}
        />
      </div>
    </div>
  );
}
