"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Cloud, Download, Lock, AlertCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

export default function SharedPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<"loading" | "password" | "preview" | "error">("loading");
  const [error, setError] = useState("");
  const [fileInfo, setFileInfo] = useState<{
    fileName: string;
    fileType: string;
    mode: string;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/shared/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Lien invalide");
          setState("error");
          return;
        }

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          if (data.requiresPassword) {
            setFileInfo(data);
            setState("password");
          }
        } else {
          // Direct file response — redirect to download/preview
          setState("preview");
        }
      })
      .catch(() => {
        setError("Erreur réseau");
        setState("error");
      });
  }, [token]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      const res = await fetch(`/api/shared/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Mot de passe incorrect");
        setPasswordLoading(false);
        return;
      }

      // Download the file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileInfo?.fileName || "file";
      a.click();
      URL.revokeObjectURL(url);
      setPasswordLoading(false);
    } catch {
      setError("Erreur réseau");
      setPasswordLoading(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Lien invalide</h1>
          <p className="text-gray-400">{error}</p>
        </motion.div>
      </div>
    );
  }

  if (state === "password") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h1 className="text-xl font-semibold text-white">
              Fichier protégé
            </h1>
            <p className="text-sm text-gray-500 mt-1">{fileInfo?.fileName}</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/20"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" loading={passwordLoading}>
              Accéder
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Preview state — show the file
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-white" />
          <span className="text-sm text-white font-medium">SPB Cloud</span>
        </div>
        <Button
          size="sm"
          onClick={() =>
            window.open(`/api/shared/${token}?action=download`, "_blank")
          }
        >
          <Download className="w-4 h-4" />
          Télécharger
        </Button>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <iframe
          src={`/api/shared/${token}`}
          className="w-full h-full min-h-[80vh] border-0 rounded-lg"
          title="Shared file"
        />
      </main>
    </div>
  );
}
