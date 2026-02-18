"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Search, Tag, FileText, MessageSquare, Sparkles, X, Loader2 } from "lucide-react";
import Button from "../ui/Button";

interface AiResult {
  fileId: string;
  name: string;
  relevance: string;
  snippet: string;
}

export default function AiPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"search" | "chat">("search");
  const [query, setQuery] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [results, setResults] = useState<AiResult[]>([]);
  const [answer, setAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    setAnswer("");
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setAnswer(data.answer || "");
      }
    } catch {}
    setSearching(false);
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatMessage("");
    setChatHistory((prev) => [...prev, { role: "user", content: msg }]);
    setChatting(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {}
    setChatting(false);
  };

  const relevanceColors: Record<string, string> = {
    high: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
    low: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400",
  };

  const inputClasses = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-gray-400 dark:focus:border-white/20 placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <>
      {/* AI Toggle Button - positioned above mobile safe area */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center transition-colors"
        title="Assistant IA"
      >
        <Brain className="w-6 h-6" />
      </button>

      {/* AI Panel */}
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
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-white/10 flex flex-col shadow-2xl pb-[env(safe-area-inset-bottom)]"
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
                <button
                  onClick={() => setTab("search")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${tab === "search" ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-500" : "text-gray-500"}`}
                >
                  <Search className="w-4 h-4" /> Recherche IA
                </button>
                <button
                  onClick={() => setTab("chat")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${tab === "chat" ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-500" : "text-gray-500"}`}
                >
                  <MessageSquare className="w-4 h-4" /> Chat
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4">
                {tab === "search" ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Rechercher avec l'IA..."
                        className={`${inputClasses} flex-1`}
                      />
                      <Button size="sm" onClick={handleSearch} loading={searching}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>

                    {answer && (
                      <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg p-3.5">
                        <p className="text-sm text-purple-800 dark:text-purple-300">{answer}</p>
                      </div>
                    )}

                    {results.map((r) => (
                      <div key={r.fileId} className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-white/5 rounded-lg">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.name}</p>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${relevanceColors[r.relevance] || relevanceColors.low}`}>
                              {r.relevance}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{r.snippet}</p>
                        </div>
                      </div>
                    ))}

                    {/* Quick actions */}
                    <div className="pt-2 space-y-2">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Actions rapides</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => { setQuery("documents récents"); handleSearch(); }} className="text-left p-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                          <FileText className="w-3 h-3 mb-1" /> Documents récents
                        </button>
                        <button onClick={() => { setQuery("images et photos"); handleSearch(); }} className="text-left p-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                          <Tag className="w-3 h-3 mb-1" /> Images & Photos
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 space-y-3 mb-4">
                      {chatHistory.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          <Brain className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                          <p className="text-sm">Posez une question sur vos fichiers</p>
                        </div>
                      )}
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                            msg.role === "user"
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-gray-200"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatting && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 dark:bg-white/10 px-3 py-2 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat input */}
              {tab === "chat" && (
                <div className="p-4 border-t border-gray-200 dark:border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleChat()}
                      placeholder="Votre message..."
                      className={`${inputClasses} flex-1`}
                    />
                    <Button size="sm" onClick={handleChat} loading={chatting}>
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
