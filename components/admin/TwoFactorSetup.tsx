"use client";

import { useState } from "react";
import { Shield, ShieldOff, ShieldCheck } from "lucide-react";
import Button from "../ui/Button";
import toast from "react-hot-toast";

interface TwoFactorSetupProps {
  enabled: boolean;
  onStatusChange: () => void;
}

export default function TwoFactorSetup({ enabled, onStatusChange }: TwoFactorSetupProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "setup" | "verify">("idle");

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCodeUrl);
        setSecret(data.secret);
        setStep("setup");
      }
    } catch {
      toast.error("Erreur");
    }
    setLoading(false);
  };

  const verifyAndEnable = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, enable: true }),
      });
      if (res.ok) {
        toast.success("2FA activé !");
        setStep("idle");
        setQrCode(null);
        setToken("");
        onStatusChange();
      } else {
        const data = await res.json();
        toast.error(data.error || "Code invalide");
      }
    } catch {
      toast.error("Erreur");
    }
    setLoading(false);
  };

  const disable2FA = async () => {
    if (!confirm("Désactiver l'authentification à deux facteurs ?")) return;
    const res = await fetch("/api/auth/2fa/disable", { method: "POST" });
    if (res.ok) {
      toast.success("2FA désactivé");
      onStatusChange();
    }
  };

  const inputClasses = "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none text-center tracking-[0.3em] sm:tracking-[0.5em] text-xl";

  return (
    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        {enabled ? (
          <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
        ) : (
          <Shield className="w-6 h-6 text-gray-400 flex-shrink-0" />
        )}
        <div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Authentification à deux facteurs (2FA)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {enabled ? "Activé - Votre compte est protégé" : "Désactivé - Activez pour plus de sécurité"}
          </p>
        </div>
      </div>

      {step === "idle" && !enabled && (
        <Button size="sm" onClick={startSetup} loading={loading} className="w-full sm:w-auto">
          <Shield className="w-4 h-4" /> Activer 2FA
        </Button>
      )}

      {step === "idle" && enabled && (
        <Button size="sm" variant="danger" onClick={disable2FA} className="w-full sm:w-auto">
          <ShieldOff className="w-4 h-4" /> Désactiver 2FA
        </Button>
      )}

      {step === "setup" && qrCode && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scannez ce QR code avec votre app authenticator (Google Authenticator, Authy, etc.)
          </p>
          <div className="flex justify-center">
            <img src={qrCode} alt="QR Code 2FA" className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg" />
          </div>
          {secret && (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Clé manuelle :</p>
              <code className="text-xs bg-gray-100 dark:bg-white/10 px-3 py-1 rounded font-mono text-gray-700 dark:text-gray-300 break-all inline-block max-w-full">
                {secret}
              </code>
            </div>
          )}
          <Button size="sm" onClick={() => setStep("verify")} className="w-full">
            Suivant
          </Button>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Entrez le code à 6 chiffres de votre app authenticator
          </p>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className={inputClasses}
            autoFocus
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => { setStep("idle"); setQrCode(null); }} className="w-full sm:flex-1">
              Annuler
            </Button>
            <Button onClick={verifyAndEnable} loading={loading} disabled={token.length !== 6} className="w-full sm:flex-1">
              Vérifier & Activer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
