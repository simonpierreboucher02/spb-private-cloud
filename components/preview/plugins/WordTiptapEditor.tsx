"use client";

// This component is imported dynamically from WordPreview (ssr: false already set there)
// so we can safely import Tiptap dependencies at the top level.
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Type,
  Loader2,
} from "lucide-react";
import { useCallback, useState } from "react";

interface WordTiptapEditorProps {
  initialHtml: string;
  onSave?: (blob: Blob, asNewVersion?: boolean) => Promise<void>;
}

export default function WordTiptapEditor({ initialHtml, onSave }: WordTiptapEditorProps) {
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UnderlineExt,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "word-content prose prose-sm sm:prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] tiptap-editor",
      },
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor || !onSave) return;
    setSaving(true);
    try {
      const html = editor.getHTML();
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
      // Dynamically import browser-compatible dist bundle (avoids Node fs dep)
      const htmlDocx = await import("html-docx-js/dist/html-docx");
      const blob = htmlDocx.asBlob(fullHtml, {
        orientation: "portrait",
        margins: { top: 720, bottom: 720, left: 1080, right: 1080 },
      });
      await onSave(blob, true);
    } finally {
      setSaving(false);
    }
  }, [editor, onSave]);

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center ${
        active
          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );

  if (!editor) return (
    <div className="flex items-center justify-center h-full gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
    </div>
  );

  return (
    <div className="absolute inset-0 flex flex-col bg-gray-50 dark:bg-[#1a1a1a]">
      {/* Toolbar — sticky so it never scrolls out of view */}
      <div className="flex items-center gap-0.5 px-3 py-2 bg-white dark:bg-[#242424] border-b border-gray-200 dark:border-white/10 overflow-x-auto shrink-0 flex-nowrap">
        {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Gras", <Bold className="w-3.5 h-3.5" />)}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italique", <Italic className="w-3.5 h-3.5" />)}
        {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "Souligné", <Underline className="w-3.5 h-3.5" />)}

        <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

        {btn(
          editor.isActive("heading", { level: 1 }),
          () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          "Titre 1",
          <span className="text-xs font-bold">H1</span>
        )}
        {btn(
          editor.isActive("heading", { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          "Titre 2",
          <span className="text-xs font-bold">H2</span>
        )}
        {btn(
          editor.isActive("heading", { level: 3 }),
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          "Titre 3",
          <span className="text-xs font-bold">H3</span>
        )}
        {btn(false, () => editor.chain().focus().setParagraph().run(), "Paragraphe", <Type className="w-3.5 h-3.5" />)}

        <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

        {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Liste à puces", <List className="w-3.5 h-3.5" />)}

        <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

        {btn(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), "Gauche", <AlignLeft className="w-3.5 h-3.5" />)}
        {btn(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), "Centré", <AlignCenter className="w-3.5 h-3.5" />)}
        {btn(editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), "Droite", <AlignRight className="w-3.5 h-3.5" />)}

        <div className="flex-1" />

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Sauvegarder
        </button>
      </div>

      {/* Editor content area */}
      <div className="flex-1 overflow-auto py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-[#242424] shadow-md rounded-sm px-8 py-10 sm:px-14 sm:py-12 min-h-[500px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .tiptap-editor { min-height: 400px; outline: none; }
        .tiptap-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .word-content h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.5rem; margin-top: 1.5rem; }
        .word-content h2 { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.4rem; margin-top: 1.2rem; }
        .word-content h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.3rem; margin-top: 1rem; }
        .word-content p  { margin-bottom: 0.6rem; line-height: 1.7; }
        .word-content ul, .word-content ol { padding-left: 1.5rem; margin-bottom: 0.6rem; }
        .word-content li { margin-bottom: 0.2rem; }
        .word-content table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
        .word-content td, .word-content th { border: 1px solid #d1d5db; padding: 0.4rem 0.6rem; text-align: left; }
        .word-content th { background: #f3f4f6; font-weight: 600; }
        .dark .word-content td, .dark .word-content th { border-color: rgba(255,255,255,0.15); }
        .dark .word-content th { background: rgba(255,255,255,0.08); }
        .word-content strong { font-weight: 700; }
        .word-content em { font-style: italic; }
        .word-content a { color: #3b82f6; text-decoration: underline; }
        .word-content img { max-width: 100%; height: auto; margin: 0.5rem 0; }
      `}</style>
    </div>
  );
}
