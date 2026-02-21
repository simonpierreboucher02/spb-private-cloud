"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Search,
  FileText,
  MessageSquare,
  Sparkles,
  X,
  Loader2,
  Send,
  Trash2,
  ScanText,
  Tag,
  Info,
  ChevronDown,
  Zap,
  File,
  Download,
  FlaskConical,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AiResult {
  fileId: string;
  name: string;
  relevance: string;
  snippet: string;
  folder?: string;
  mimeType?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnalyserFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  aiTags?: string | null;
  aiDescription?: string | null;
  ocrText?: string | null;
  folder?: { name: string } | null;
}

type Tab = "search" | "chat" | "analyse";

const relevanceColors: Record<string, string> = {
  high: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  low: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
};

const mimeIcon = (mime: string) => {
  if (!mime) return "📁";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📄";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("audio/")) return "🎵";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("spreadsheet") || mime === "text/csv") return "📊";
  if (mime.startsWith("text/")) return "📃";
  return "📁";
};

const inputClasses =
  "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 placeholder-gray-400 dark:placeholder-gray-500";

export default function AiPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");

  // Search state
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<AiResult[]>([]);
  const [answer, setAnswer] = useState("");

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Analyser state
  const [analyserFiles, setAnalyserFiles] = useState<AnalyserFile[]>([]);
  const [analyserLoading, setAnalyserLoading] = useState(false);
  const [analyserError, setAnalyserError] = useState(false);
  const [analyserQuery, setAnalyserQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<AnalyserFile | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analyserResult, setAnalyserResult] = useState<{ type: string; content: string } | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, streamingContent]);

  // Fetch files for analyser
  const fetchAnalyserFiles = useCallback(async (q = "") => {
    setAnalyserLoading(true);
    setAnalyserError(false);
    try {
      const res = await fetch(`/api/ai/files?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyserFiles(Array.isArray(data) ? data : []);
      } else {
        setAnalyserError(true);
      }
    } catch {
      setAnalyserError(true);
    } finally {
      setAnalyserLoading(false);
    }
  }, []);

  // Load files when switching to analyse tab, auto-open picker
  useEffect(() => {
    if (tab === "analyse") {
      fetchAnalyserFiles();
      setShowFilePicker(true);
    }
  }, [tab, fetchAnalyserFiles]);

  // ─── Jump to Analyser with a specific file ─────────────────
  const openInAnalyser = useCallback((file: AnalyserFile) => {
    setSelectedFile(file);
    setAnalyserResult(null);
    setShowFilePicker(false);
    setTab("analyse");
  }, []);

  // ─── Search ────────────────────────────────────────────────
  const handleSearch = useCallback(async (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setSearching(true);
    setResults([]);
    setAnswer("");
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setAnswer(data.answer || "");
      }
    } catch {}
    setSearching(false);
  }, [query]);

  const quickSearch = (q: string) => {
    setQuery(q);
    handleSearch(q);
  };

  // ─── Chat (streaming) ──────────────────────────────────────
  const handleChat = async () => {
    const msg = chatInput.trim();
    if (!msg || isStreaming) return;
    setChatInput("");

    const historyToSend = [...chatHistory];
    setChatHistory((prev) => [...prev, { role: "user", content: msg }]);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: historyToSend, stream: true }),
      });

      if (!res.ok || !res.body) throw new Error("Stream error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              accumulated += parsed.token;
              setStreamingContent(accumulated);
            }
          } catch {}
        }
      }

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: accumulated || "Désolé, aucune réponse." },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Erreur de connexion. Réessayez." },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  // ─── Analyser ──────────────────────────────────────────────
  const handleAnalyse = async (action: "ocr" | "describe" | "tag") => {
    if (!selectedFile) return;
    setAnalysing(true);
    setAnalyserResult(null);
    const endpoint =
      action === "ocr" ? "/api/ai/ocr" : action === "describe" ? "/api/ai/describe" : "/api/ai/tag";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: selectedFile.id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (action === "ocr")
          setAnalyserResult({ type: "Texte extrait (OCR)", content: data.text || "Aucun texte trouvé." });
        else if (action === "describe")
          setAnalyserResult({ type: "Description", content: data.description || "Impossible de décrire." });
        else {
          const tags = Array.isArray(data.tags) ? data.tags : [];
          setAnalyserResult({ type: "Tags générés", content: tags.join(", ") || "Aucun tag." });
        }
      }
    } catch {
      setAnalyserResult({ type: "Erreur", content: "Impossible d'analyser ce fichier." });
    }
    setAnalysing(false);
  };

  const handleAnalyseAll = async () => {
    if (!selectedFile) return;
    setAnalysing(true);
    setAnalyserResult(null);
    try {
      const [descRes, tagRes] = await Promise.all([
        fetch("/api/ai/describe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId: selectedFile.id }) }),
        fetch("/api/ai/tag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId: selectedFile.id }) }),
      ]);
      const desc = descRes.ok ? (await descRes.json()).description : "";
      const tags = tagRes.ok ? (await tagRes.json()).tags : [];
      setAnalyserResult({
        type: "Analyse complète",
        content: `**Description :** ${desc}\n\n**Tags :** ${Array.isArray(tags) ? tags.join(", ") : "—"}`,
      });
    } catch {
      setAnalyserResult({ type: "Erreur", content: "Erreur lors de l'analyse." });
    }
    setAnalysing(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center transition-colors"
        title="Assistant IA"
      >
        <Brain className="w-6 h-6" />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-white/10 flex flex-col shadow-2xl pb-[env(safe-area-inset-bottom)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" /> Assistant IA
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-white/10">
                {(["chat", "search", "analyse"] as Tab[]).map((t) => {
                  const icons = { chat: MessageSquare, search: Search, analyse: ScanText };
                  const labels = { chat: "Chat", search: "Recherche", analyse: "Analyser" };
                  const Icon = icons[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 px-2 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                        tab === t
                          ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-500"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {labels[t]}
                    </button>
                  );
                })}
              </div>

              {/* ── CHAT TAB ── */}
              {tab === "chat" && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {chatHistory.length === 0 && !isStreaming && (
                      <div className="text-center py-6">
                        <Brain className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-500 mb-4">Posez une question sur vos fichiers</p>
                        <div className="space-y-2 text-left">
                          {[
                            "Résume mes fichiers récents",
                            "Quels sont mes documents importants ?",
                            "Aide-moi à organiser mes fichiers",
                          ].map((prompt) => (
                            <button
                              key={prompt}
                              onClick={() => setChatInput(prompt)}
                              className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:border-purple-200 dark:hover:border-purple-500/30 transition-colors"
                            >
                              <Zap className="w-3 h-3 inline mr-1.5 text-purple-400" />
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                            <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        <div
                          className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-purple-600 text-white rounded-tr-sm"
                              : "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-100 rounded-tl-sm"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-1">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    ))}

                    {isStreaming && (
                      <div className="flex justify-start">
                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="max-w-[82%] px-3 py-2.5 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-white/10 text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                          {streamingContent ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                              <ReactMarkdown>{streamingContent}</ReactMarkdown>
                            </div>
                          ) : (
                            <span className="flex items-center gap-1">
                              {[0, 150, 300].map((d) => (
                                <span key={d} className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-200 dark:border-white/10">
                    {chatHistory.length > 0 && (
                      <button
                        onClick={() => setChatHistory([])}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors mb-2"
                      >
                        <Trash2 className="w-3 h-3" /> Effacer la conversation
                      </button>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
                        placeholder="Votre message..."
                        className={`${inputClasses} flex-1`}
                        disabled={isStreaming}
                      />
                      <button
                        onClick={handleChat}
                        disabled={isStreaming || !chatInput.trim()}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                      >
                        {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SEARCH TAB ── */}
              {tab === "search" && (
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Ex: rapports financiers 2024..."
                      className={`${inputClasses} flex-1`}
                    />
                    <button
                      onClick={() => handleSearch()}
                      disabled={searching || !query.trim()}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition-colors"
                    >
                      {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Quick suggestions */}
                  {!answer && results.length === 0 && !searching && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestions</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "Documents récents", query: "documents récents" },
                          { label: "Images & Photos", query: "images et photos" },
                          { label: "PDFs", query: "fichiers PDF" },
                          { label: "Fichiers texte", query: "fichiers texte markdown" },
                        ].map((s) => (
                          <button
                            key={s.query}
                            onClick={() => quickSearch(s.query)}
                            className="text-left p-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 border border-transparent hover:border-purple-200 dark:hover:border-purple-500/30 transition-colors"
                          >
                            <Search className="w-3 h-3 mb-1 text-purple-400" />
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {answer && (
                    <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg p-3.5">
                      <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
                        <Brain className="w-3 h-3" /> Synthèse IA
                      </p>
                      <p className="text-sm text-purple-800 dark:text-purple-300">{answer}</p>
                    </div>
                  )}

                  {results.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">{results.length} résultat(s) trouvé(s)</p>
                      {results.map((r) => (
                        <div
                          key={r.fileId}
                          className="p-3.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-base flex-shrink-0 mt-0.5">{mimeIcon(r.mimeType || "")}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.name}</p>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${relevanceColors[r.relevance] || relevanceColors.low}`}>
                                  {r.relevance}
                                </span>
                              </div>
                              {r.folder && <p className="text-[10px] text-gray-400 mb-0.5">📁 {r.folder}</p>}
                              <p className="text-xs text-gray-500">{r.snippet}</p>
                            </div>
                          </div>
                          {/* Actions on search results */}
                          <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/10">
                            <button
                              onClick={() => openInAnalyser({
                                id: r.fileId,
                                name: r.name,
                                mimeType: r.mimeType || "",
                                size: 0,
                              })}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                            >
                              <FlaskConical className="w-3 h-3" /> Analyser
                            </button>
                            <button
                              onClick={() => window.open(`/api/files/${r.fileId}/download`, "_blank")}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                            >
                              <Download className="w-3 h-3" /> Télécharger
                            </button>
                            <button
                              onClick={() => {
                                setChatInput(`Résume le fichier ${r.name}`);
                                setTab("chat");
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" /> Résumer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ANALYSE TAB ── */}
              {tab === "analyse" && (
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {/* File picker */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Fichier à analyser</p>
                    <button
                      onClick={() => setShowFilePicker(!showFilePicker)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-left hover:border-purple-300 dark:hover:border-purple-500/40 transition-colors"
                    >
                      <span className={selectedFile ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                        {selectedFile ? (
                          <span className="flex items-center gap-2">
                            <span>{mimeIcon(selectedFile.mimeType)}</span>
                            <span className="truncate max-w-[240px]">{selectedFile.name}</span>
                          </span>
                        ) : "Choisir un fichier..."}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${showFilePicker ? "rotate-180" : ""}`} />
                    </button>

                    {showFilePicker && (
                      <div className="mt-1 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                        <div className="p-2 border-b border-gray-100 dark:border-white/10">
                          <input
                            type="text"
                            value={analyserQuery}
                            onChange={(e) => {
                              setAnalyserQuery(e.target.value);
                              fetchAnalyserFiles(e.target.value);
                            }}
                            placeholder="Filtrer par nom..."
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-56 overflow-auto">
                          {analyserLoading && (
                            <div className="flex items-center justify-center p-4 gap-2 text-xs text-gray-400">
                              <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                            </div>
                          )}
                          {analyserError && (
                            <div className="flex items-center gap-2 p-3 text-xs text-red-500">
                              <AlertCircle className="w-4 h-4" /> Impossible de charger les fichiers.
                            </div>
                          )}
                          {!analyserLoading && !analyserError && analyserFiles.length === 0 && (
                            <p className="p-3 text-xs text-gray-400 text-center">Aucun fichier trouvé</p>
                          )}
                          {!analyserLoading && analyserFiles.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => {
                                setSelectedFile(f);
                                setShowFilePicker(false);
                                setAnalyserResult(null);
                                setAnalyserQuery("");
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors border-b border-gray-50 dark:border-white/5 last:border-0 ${
                                selectedFile?.id === f.id
                                  ? "bg-purple-50 dark:bg-purple-500/10"
                                  : "hover:bg-gray-50 dark:hover:bg-white/5"
                              }`}
                            >
                              <span className="text-base flex-shrink-0">{mimeIcon(f.mimeType)}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{f.name}</p>
                                {f.folder && <p className="text-[10px] text-gray-400">📁 {f.folder.name}</p>}
                              </div>
                              {f.aiDescription && (
                                <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" title="Déjà analysé" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analysis actions */}
                  {selectedFile && (
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-0.5">Fichier sélectionné</p>
                            <p className="text-sm font-medium text-purple-900 dark:text-purple-200 truncate">{selectedFile.name}</p>
                            {selectedFile.folder && <p className="text-xs text-purple-400 mt-0.5">📁 {selectedFile.folder.name}</p>}
                          </div>
                          <button
                            onClick={() => window.open(`/api/files/${selectedFile.id}/download`, "_blank")}
                            className="flex-shrink-0 p-1.5 rounded-lg text-purple-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {selectedFile.aiDescription && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 border-t border-purple-200 dark:border-purple-500/30 pt-2">{selectedFile.aiDescription}</p>
                        )}
                        {selectedFile.aiTags && (() => {
                          try {
                            const tags = JSON.parse(selectedFile.aiTags as string) as string[];
                            return (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {tags.map((t) => (
                                  <span key={t} className="px-1.5 py-0.5 bg-purple-200 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300 rounded text-[10px]">{t}</span>
                                ))}
                              </div>
                            );
                          } catch { return null; }
                        })()}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(selectedFile.mimeType.startsWith("image/") || selectedFile.mimeType === "application/pdf") && (
                          <button
                            onClick={() => handleAnalyse("ocr")}
                            disabled={analysing}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500/40 disabled:opacity-50 transition-colors"
                          >
                            <ScanText className="w-3.5 h-3.5 text-purple-500" /> OCR
                          </button>
                        )}
                        <button
                          onClick={() => handleAnalyse("describe")}
                          disabled={analysing}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500/40 disabled:opacity-50 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5 text-purple-500" /> Décrire
                        </button>
                        <button
                          onClick={() => handleAnalyse("tag")}
                          disabled={analysing}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500/40 disabled:opacity-50 transition-colors"
                        >
                          <Tag className="w-3.5 h-3.5 text-purple-500" /> Auto-tagger
                        </button>
                        <button
                          onClick={handleAnalyseAll}
                          disabled={analysing}
                          className="flex items-center justify-center gap-2 px-3 py-2.5 bg-purple-600 hover:bg-purple-700 border border-transparent rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-colors col-span-full"
                        >
                          {analysing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                          Analyse complète
                        </button>
                      </div>

                      {/* Also: ask Claude about this file */}
                      <button
                        onClick={() => {
                          setChatInput(`Résume le fichier ${selectedFile.name}`);
                          setTab("chat");
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Demander à Claude de résumer ce fichier
                      </button>

                      {analysing && !analyserResult && (
                        <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> Analyse en cours...
                        </div>
                      )}

                      {analyserResult && (
                        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-3.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{analyserResult.type}</p>
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1">
                            <ReactMarkdown>{analyserResult.content}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedFile && !showFilePicker && (
                    <div className="text-center py-8">
                      <File className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sélectionnez un fichier ci-dessus pour l&apos;analyser
                      </p>
                      <p className="text-xs text-gray-400 mt-1">OCR, description, tags automatiques</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
