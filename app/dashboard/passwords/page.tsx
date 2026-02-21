"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Plus, Eye, EyeOff, Copy, Trash2, Edit2, Search,
  RefreshCw, Shield, ShieldAlert, ShieldCheck, ShieldX,
  Zap, Key, Globe, User, FileText, Check, X, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PasswordEntry {
  id: string;
  siteName: string;
  siteUrl: string | null;
  username: string | null;
  password: string;
  notes: string | null;
  createdAt: string;
}

// ─── Password Strength Logic ──────────────────────────────────────────────────
function analyzePassword(pwd: string) {
  if (!pwd) return { score: 0, label: "", color: "", checks: [] };

  const checks = [
    { label: "Au moins 8 caractères",  ok: pwd.length >= 8 },
    { label: "Au moins 12 caractères", ok: pwd.length >= 12 },
    { label: "Majuscules (A-Z)",        ok: /[A-Z]/.test(pwd) },
    { label: "Minuscules (a-z)",        ok: /[a-z]/.test(pwd) },
    { label: "Chiffres (0-9)",          ok: /[0-9]/.test(pwd) },
    { label: "Symboles (!@#$...)",      ok: /[^A-Za-z0-9]/.test(pwd) },
  ];

  const score = checks.filter((c) => c.ok).length;

  const labels = ["", "Très faible", "Faible", "Moyen", "Bon", "Fort", "Excellent"];
  const colors = ["", "text-red-500", "text-orange-500", "text-yellow-500", "text-blue-500", "text-green-500", "text-emerald-500"];
  const bars   = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500", "bg-emerald-500"];

  return { score, label: labels[score] || "", color: colors[score] || "", barColor: bars[score] || "", checks };
}

// ─── Password Generator ───────────────────────────────────────────────────────
function generatePassword(opts: { length: number; upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }) {
  const sets = [
    opts.upper   ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
    opts.lower   ? "abcdefghijklmnopqrstuvwxyz" : "",
    opts.numbers ? "0123456789" : "",
    opts.symbols ? "!@#$%^&*()-_=+[]{}|;:,.<>?" : "",
  ].join("");
  if (!sets) return "";
  return Array.from({ length: opts.length }, () => sets[Math.floor(Math.random() * sets.length)]).join("");
}

// ─── Site Icon ────────────────────────────────────────────────────────────────
function SiteIcon({ name, url }: { name: string; url?: string | null }) {
  const colors = ["bg-blue-500", "bg-red-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500", "bg-teal-500", "bg-indigo-500"];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (url) {
    try {
      const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt={name}
          className="w-8 h-8 rounded-lg"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      );
    } catch {}
  }
  return (
    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

const inputCls = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-white/20";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PasswordsPage() {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"vault" | "generator" | "checker">("vault");

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null);
  const [form, setForm] = useState({ siteName: "", siteUrl: "", username: "", password: "", notes: "" });
  const [formShowPw, setFormShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // Revealed passwords per entry
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);

  // Generator state
  const [genOpts, setGenOpts] = useState({ length: 16, upper: true, lower: true, numbers: true, symbols: true });
  const [genResult, setGenResult] = useState("");
  const [genCopied, setGenCopied] = useState(false);

  // Checker state
  const [checkerPwd, setCheckerPwd] = useState("");
  const [checkerShow, setCheckerShow] = useState(false);

  // ── Fetch ──
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/passwords");
      if (res.ok) {
        setEntries(await res.json());
      } else if (res.status === 401) {
        toast.error("Session expirée, veuillez vous reconnecter");
      } else {
        toast.error("Erreur lors du chargement");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { setGenResult(generatePassword(genOpts)); }, [genOpts]);

  // ── Reveal password ──
  const revealPassword = async (id: string) => {
    if (revealed[id]) {
      setRevealed((prev) => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    setRevealing(id);
    const res = await fetch(`/api/passwords/${id}`);
    if (res.ok) {
      const data = await res.json();
      setRevealed((prev) => ({ ...prev, [id]: data.password }));
    }
    setRevealing(null);
  };

  // ── Copy ──
  const copyText = (text: string, label = "Copié !") => {
    navigator.clipboard.writeText(text).then(() => toast.success(label));
  };

  // ── Save (add or edit) ──
  const handleSave = async () => {
    if (!form.siteName.trim() || !form.password.trim()) return;
    setSaving(true);
    try {
      const method = editEntry ? "PATCH" : "POST";
      const url = editEntry ? `/api/passwords/${editEntry.id}` : "/api/passwords";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editEntry ? "Modifié" : "Ajouté");
        setShowAdd(false);
        setEditEntry(null);
        setForm({ siteName: "", siteUrl: "", username: "", password: "", notes: "" });
        setFormShowPw(false);
        fetchEntries();
        setRevealed({});
      } else {
        let errMsg = "Erreur";
        try {
          const d = await res.json();
          errMsg = d.error || errMsg;
        } catch {}
        toast.error(errMsg);
      }
    } catch (e) {
      console.error("handleSave error:", e);
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (entry: PasswordEntry) => {
    // Fetch decrypted password for editing
    const res = await fetch(`/api/passwords/${entry.id}`);
    const data = res.ok ? await res.json() : entry;
    setForm({ siteName: data.siteName, siteUrl: data.siteUrl || "", username: data.username || "", password: data.password, notes: data.notes || "" });
    setEditEntry(entry);
    setShowAdd(true);
    setFormShowPw(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet identifiant ?")) return;
    const res = await fetch(`/api/passwords/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Supprimé"); fetchEntries(); }
  };

  // ── Generator ──
  const regenerate = () => setGenResult(generatePassword(genOpts));
  const copyGen = () => {
    copyText(genResult, "Mot de passe copié !");
    setGenCopied(true);
    setTimeout(() => setGenCopied(false), 2000);
  };

  // ── Filter ──
  const filtered = entries.filter((e) =>
    e.siteName.toLowerCase().includes(search.toLowerCase()) ||
    (e.username || "").toLowerCase().includes(search.toLowerCase())
  );

  const analysis = analyzePassword(checkerPwd);

  // ── Render ──
  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gray-700 dark:text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Gestionnaire de mots de passe</h1>
              <p className="text-xs text-gray-500">Chiffrement AES-256-GCM · Stockage local sécurisé</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
            {([
              { id: "vault",     label: "Coffre-fort", icon: Key },
              { id: "generator", label: "Générateur",  icon: Zap },
              { id: "checker",   label: "Validateur",  icon: Shield },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  tab === id
                    ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── VAULT TAB ── */}
        {tab === "vault" && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Toolbar */}
            <div className="px-4 lg:px-6 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-white/10">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Rechercher parmi ${entries.length} identifiant(s)...`}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                />
              </div>
              <Button size="sm" onClick={() => { setEditEntry(null); setForm({ siteName: "", siteUrl: "", username: "", password: "", notes: "" }); setShowAdd(true); }}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter</span>
              </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto px-4 lg:px-6 py-4 space-y-2">
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-gray-300 dark:border-white/20 border-t-gray-700 dark:border-t-white rounded-full animate-spin" />
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Lock className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {search ? "Aucun résultat" : "Aucun identifiant. Commencez par en ajouter un."}
                  </p>
                </div>
              )}

              {!loading && filtered.map((entry) => {
                const isRevealed = !!revealed[entry.id];
                const displayPw = isRevealed ? revealed[entry.id] : "••••••••••••";
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-gray-300 dark:hover:border-white/20 transition-colors group"
                  >
                    <SiteIcon name={entry.siteName} url={entry.siteUrl} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.siteName}</p>
                        {entry.siteUrl && (
                          <a href={entry.siteUrl.startsWith("http") ? entry.siteUrl : `https://${entry.siteUrl}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                            <Globe className="w-3 h-3 text-gray-400 hover:text-blue-500 transition-colors" />
                          </a>
                        )}
                      </div>
                      {entry.username && (
                        <button onClick={() => copyText(entry.username!, "Identifiant copié !")} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors mt-0.5">
                          <User className="w-3 h-3" />
                          {entry.username}
                        </button>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-mono text-gray-400 dark:text-gray-500 tracking-wider">
                          {displayPw}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => revealPassword(entry.id)}
                        disabled={revealing === entry.id}
                        className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                        title={isRevealed ? "Masquer" : "Révéler"}
                      >
                        {revealing === entry.id
                          ? <div className="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                          : isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {isRevealed && (
                        <button onClick={() => copyText(revealed[entry.id], "Mot de passe copié !")} className="p-2 text-gray-400 hover:text-green-500 transition-colors" title="Copier le mot de passe">
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(entry)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors sm:opacity-0 sm:group-hover:opacity-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(entry.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors sm:opacity-0 sm:group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── GENERATOR TAB ── */}
        {tab === "generator" && (
          <div className="flex-1 overflow-auto px-4 lg:px-6 py-6">
            <div className="max-w-lg mx-auto space-y-6">
              {/* Generated password display */}
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Mot de passe généré</p>
                <div className="flex items-center gap-3">
                  <p className="flex-1 text-lg font-mono font-semibold text-gray-900 dark:text-white break-all leading-tight">
                    {genResult || <span className="text-gray-400 text-sm">Sélectionnez des options</span>}
                  </p>
                </div>
                {genResult && (
                  <div className="mt-3">
                    {(() => { const a = analyzePassword(genResult); return (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-white/10 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${a.barColor}`} style={{ width: `${(a.score / 6) * 100}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${a.color}`}>{a.label}</span>
                      </div>
                    ); })()}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={regenerate}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Régénérer
                  </button>
                  <button
                    onClick={copyGen}
                    disabled={!genResult}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex-1 justify-center ${genCopied ? "bg-green-600" : "bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"}`}
                  >
                    {genCopied ? <><Check className="w-4 h-4" /> Copié !</> : <><Copy className="w-4 h-4" /> Copier</>}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {/* Length */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Longueur</label>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{genOpts.length}</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={64}
                    value={genOpts.length}
                    onChange={(e) => setGenOpts({ ...genOpts, length: Number(e.target.value) })}
                    className="w-full accent-gray-900 dark:accent-white"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>6</span><span>64</span>
                  </div>
                </div>

                {/* Character types */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Types de caractères</p>
                  {([
                    { key: "upper",   label: "Majuscules",  example: "A-Z" },
                    { key: "lower",   label: "Minuscules",  example: "a-z" },
                    { key: "numbers", label: "Chiffres",    example: "0-9" },
                    { key: "symbols", label: "Symboles",    example: "!@#$" },
                  ] as const).map(({ key, label, example }) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                      <div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        <span className="text-xs text-gray-400 ml-2">{example}</span>
                      </div>
                      <div
                        onClick={() => setGenOpts({ ...genOpts, [key]: !genOpts[key] })}
                        className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${genOpts[key] ? "bg-gray-900 dark:bg-white" : "bg-gray-300 dark:bg-white/20"}`}
                      >
                        <div className={`w-5 h-5 bg-white dark:bg-gray-900 rounded-full shadow mt-0.5 transition-transform ${genOpts[key] ? "translate-x-4.5 ml-4.5" : "translate-x-0.5 ml-0.5"}`}
                          style={{ transform: genOpts[key] ? "translateX(18px)" : "translateX(2px)" }}
                        />
                      </div>
                    </label>
                  ))}
                </div>

                {/* Use in vault shortcut */}
                <button
                  onClick={() => {
                    setForm((f) => ({ ...f, password: genResult }));
                    setTab("vault");
                    setShowAdd(true);
                    setFormShowPw(true);
                  }}
                  disabled={!genResult}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-white/30 transition-colors"
                >
                  <Key className="w-4 h-4" /> Utiliser ce mot de passe dans le coffre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CHECKER TAB ── */}
        {tab === "checker" && (
          <div className="flex-1 overflow-auto px-4 lg:px-6 py-6">
            <div className="max-w-lg mx-auto space-y-6">
              {/* Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entrez un mot de passe à analyser
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={checkerShow ? "text" : "password"}
                    value={checkerPwd}
                    onChange={(e) => setCheckerPwd(e.target.value)}
                    placeholder="Votre mot de passe..."
                    className={`${inputCls} pl-10 pr-10`}
                  />
                  <button onClick={() => setCheckerShow(!checkerShow)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {checkerShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {checkerPwd && (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Score bar */}
                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Niveau de sécurité</p>
                        <span className={`text-lg font-bold ${analysis.color}`}>{analysis.label}</span>
                      </div>

                      {/* Score bars */}
                      <div className="flex gap-1 mb-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i < analysis.score ? analysis.barColor : "bg-gray-200 dark:bg-white/10"}`} />
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Longueur : <strong className="text-gray-900 dark:text-white">{checkerPwd.length} caractères</strong></span>
                        <span>Score : <strong className="text-gray-900 dark:text-white">{analysis.score}/6</strong></span>
                      </div>
                    </div>

                    {/* Checks */}
                    <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Critères de sécurité</p>
                      <div className="space-y-2">
                        {analysis.checks.map((c) => (
                          <div key={c.label} className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${c.ok ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-500/20 text-red-500"}`}>
                              {c.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </div>
                            <span className={`text-sm ${c.ok ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                      analysis.score >= 5 ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300"
                      : analysis.score >= 3 ? "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-300"
                      : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300"
                    }`}>
                      {analysis.score >= 5 ? <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                       : analysis.score >= 3 ? <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                       : <ShieldX className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                      <p className="text-sm">
                        {analysis.score >= 5
                          ? "Excellent ! Ce mot de passe est très sécurisé."
                          : analysis.score >= 4
                          ? "Bon mot de passe. Ajoutez des symboles pour l'améliorer."
                          : analysis.score >= 3
                          ? "Mot de passe moyen. Augmentez la longueur et la diversité des caractères."
                          : analysis.score >= 2
                          ? "Mot de passe faible. Utilisez au moins 12 caractères avec majuscules, chiffres et symboles."
                          : "Mot de passe très faible ! Changez-le immédiatement avec notre générateur."}
                      </p>
                    </div>

                    {analysis.score < 5 && (
                      <button
                        onClick={() => setTab("generator")}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                      >
                        <Zap className="w-4 h-4" /> Générer un mot de passe sécurisé
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {!checkerPwd && (
                <div className="text-center py-12">
                  <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Entrez un mot de passe pour l&apos;analyser</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setEditEntry(null); setFormShowPw(false); }}
        title={editEntry ? "Modifier l'identifiant" : "Nouvel identifiant"}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Site / Service *</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} placeholder="Facebook, Gmail, Netflix..." className={`${inputCls} pl-9`} autoFocus />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">URL (optionnel)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="url" value={form.siteUrl} onChange={(e) => setForm({ ...form, siteUrl: e.target.value })} placeholder="https://facebook.com" className={`${inputCls} pl-9`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Identifiant / Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="user@example.com" className={`${inputCls} pl-9`} autoComplete="off" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mot de passe *</label>
              <button
                type="button"
                onClick={() => { const p = generatePassword(genOpts); setForm({ ...form, password: p }); setFormShowPw(true); }}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3" /> Générer
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={formShowPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className={`${inputCls} pl-9 pr-9`}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setFormShowPw(!formShowPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {formShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Inline strength bar in modal */}
            {form.password && (() => { const a = analyzePassword(form.password); return (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`flex-1 h-1 rounded-full ${i < a.score ? a.barColor : "bg-gray-200 dark:bg-white/10"}`} />
                  ))}
                </div>
                <span className={`text-xs ${a.color}`}>{a.label}</span>
              </div>
            ); })()}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes (optionnel)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Compte personnel, code de récupération..." rows={2} className={`${inputCls} pl-9 resize-none`} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="ghost" onClick={() => { setShowAdd(false); setEditEntry(null); }}>Annuler</Button>
          <Button onClick={handleSave} loading={saving} disabled={!form.siteName.trim() || !form.password.trim()}>
            {editEntry ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
