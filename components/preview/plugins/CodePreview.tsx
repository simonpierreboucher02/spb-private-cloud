"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Copy, Check, WrapText } from "lucide-react";
import type { PreviewPluginProps } from "./types";
import { getLanguageFromMime, getLanguageFromFilename } from "@/lib/utils";

export default function CodePreview({ file, isEditing, onSave }: PreviewPluginProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewRef = useRef<any>(null);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [modified, setModified] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Load content
  useEffect(() => {
    setLoading(true);
    fetch(`/api/files/${file.id}/preview`)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [file.id]);

  // Initialize CodeMirror
  useEffect(() => {
    if (loading || !editorRef.current) return;

    let destroyed = false;

    const initEditor = async () => {
      const { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, highlightActiveLine } = await import("@codemirror/view");
      const { EditorState } = await import("@codemirror/state");
      const { defaultKeymap, history, historyKeymap, indentWithTab } = await import("@codemirror/commands");
      const { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, foldKeymap, indentOnInput } = await import("@codemirror/language");
      const { searchKeymap, highlightSelectionMatches } = await import("@codemirror/search");
      const { oneDark } = await import("@codemirror/theme-one-dark");

      if (destroyed || !editorRef.current) return;

      // Get language extension
      const lang = getLanguageFromMime(file.mimeType) || getLanguageFromFilename(file.name);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let langExtension: any = null;

      try {
        switch (lang) {
          case "javascript": case "typescript": {
            const { javascript } = await import("@codemirror/lang-javascript");
            langExtension = javascript({ typescript: lang === "typescript", jsx: true });
            break;
          }
          case "html": {
            const { html } = await import("@codemirror/lang-html");
            langExtension = html();
            break;
          }
          case "css": {
            const { css } = await import("@codemirror/lang-css");
            langExtension = css();
            break;
          }
          case "json": {
            const { json } = await import("@codemirror/lang-json");
            langExtension = json();
            break;
          }
          case "markdown": {
            const { markdown } = await import("@codemirror/lang-markdown");
            langExtension = markdown();
            break;
          }
          case "python": {
            const { python } = await import("@codemirror/lang-python");
            langExtension = python();
            break;
          }
          case "xml": {
            const { xml } = await import("@codemirror/lang-xml");
            langExtension = xml();
            break;
          }
          case "sql": {
            const { sql } = await import("@codemirror/lang-sql");
            langExtension = sql();
            break;
          }
          case "java": {
            const { java } = await import("@codemirror/lang-java");
            langExtension = java();
            break;
          }
          case "c": case "cpp": {
            const { cpp } = await import("@codemirror/lang-cpp");
            langExtension = cpp();
            break;
          }
          case "rust": {
            const { rust } = await import("@codemirror/lang-rust");
            langExtension = rust();
            break;
          }
          case "go": {
            const { go } = await import("@codemirror/lang-go");
            langExtension = go();
            break;
          }
          case "php": {
            const { php } = await import("@codemirror/lang-php");
            langExtension = php();
            break;
          }
        }
      } catch {
        // Language not available, continue without
      }

      const extensions = [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        drawSelection(),
        highlightActiveLine(),
        bracketMatching(),
        foldGutter(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle),
        highlightSelectionMatches(),
        history(),
        oneDark,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...searchKeymap,
          indentWithTab,
        ]),
        EditorView.editable.of(isEditing),
        EditorState.readOnly.of(!isEditing),
      ];

      if (langExtension) extensions.push(langExtension);

      if (wordWrap) {
        extensions.push(EditorView.lineWrapping);
      }

      if (isEditing && onSave) {
        extensions.push(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              setModified(true);
              if (saveTimeout.current) clearTimeout(saveTimeout.current);
              saveTimeout.current = setTimeout(() => {
                const text = update.state.doc.toString();
                onSave(text, false).then(() => setModified(false));
              }, 2000);
            }
          }),
          keymap.of([{
            key: "Mod-s",
            run: (view) => {
              if (saveTimeout.current) clearTimeout(saveTimeout.current);
              const text = view.state.doc.toString();
              onSave(text, false).then(() => setModified(false));
              return true;
            },
          }]),
        );
      }

      // Clean up previous editor
      if (viewRef.current) viewRef.current.destroy();

      editorRef.current.innerHTML = "";
      const view = new EditorView({
        state: EditorState.create({ doc: content, extensions }),
        parent: editorRef.current,
      });

      viewRef.current = view;
    };

    initEditor();

    return () => {
      destroyed = true;
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [loading, content, isEditing, wordWrap, file.mimeType, file.name]);

  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-white/5">
        <span className="text-xs text-gray-500 mr-2">
          {getLanguageFromMime(file.mimeType) || getLanguageFromFilename(file.name)}
        </span>
        {isEditing && modified && (
          <span className="text-xs text-yellow-400 mr-2">modifié</span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setWordWrap(!wordWrap)}
          className={`p-1.5 transition-colors rounded hover:bg-white/10 ${wordWrap ? "text-white" : "text-gray-400"}`}
          title="Retour à la ligne"
        >
          <WrapText className="w-4 h-4" />
        </button>
        <button
          onClick={copyContent}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
          title="Copier"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Editor */}
      <div ref={editorRef} className="flex-1 overflow-auto [&_.cm-editor]:h-full [&_.cm-scroller]:!overflow-auto" />
    </div>
  );
}
