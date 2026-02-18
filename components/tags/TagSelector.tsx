"use client";

import { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import TagBadge from "./TagBadge";

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  fileId: string;
  currentTags: { id: string; tag: TagData }[];
  onTagsChange: () => void;
}

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export default function TagSelector({ fileId, currentTags, onTagsChange }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setAllTags)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const currentTagIds = currentTags.map((t) => t.tag.id);
  const availableTags = allTags.filter((t) => !currentTagIds.includes(t.id));

  const addTag = async (tagId: string) => {
    await fetch(`/api/files/${fileId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    onTagsChange();
  };

  const removeTag = async (tagId: string) => {
    await fetch(`/api/files/${fileId}/tags/${tagId}`, { method: "DELETE" });
    onTagsChange();
  };

  const createAndAddTag = async () => {
    if (!newTagName.trim()) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
    });
    const tag = await res.json();
    setAllTags((prev) => [...prev, tag]);
    await addTag(tag.id);
    setNewTagName("");
    setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap gap-1.5 items-center">
        {currentTags.map((ft) => (
          <TagBadge
            key={ft.id}
            name={ft.tag.name}
            color={ft.tag.color}
            onRemove={() => removeTag(ft.tag.id)}
            size="md"
          />
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-white border border-dashed border-white/20 hover:border-white/40 rounded-full transition-colors"
        >
          <Plus className="w-3 h-3" />
          Tag
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 p-2">
          {availableTags.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 mb-1">Tags existants</p>
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag.id)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-gray-300 hover:bg-white/10 rounded transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 pt-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider px-2 mb-1">Nouveau tag</p>
            <div className="flex items-center gap-1 px-1">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createAndAddTag()}
                placeholder="Nom..."
                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder:text-gray-600"
                autoFocus
              />
              <div className="flex gap-0.5">
                {TAG_COLORS.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewTagColor(c)}
                    className={`w-4 h-4 rounded-full border-2 ${
                      newTagColor === c ? "border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={createAndAddTag}
                disabled={!newTagName.trim()}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
