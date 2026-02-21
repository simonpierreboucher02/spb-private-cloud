"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Check } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import toast from "react-hot-toast";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    onClose();
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const newPasswordValid = newPassword.length >= 6;
  const canSubmit = currentPassword && newPasswordValid && passwordsMatch;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Mot de passe modifié avec succès");
        handleClose();
      } else {
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-white/20";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Changer le mot de passe">
      {/* Current password */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Mot de passe actuel
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className={inputBase}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Nouveau mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 caractères"
            className={`${inputBase} ${newPassword && !newPasswordValid ? "border-red-400 dark:border-red-500" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {newPassword && !newPasswordValid && (
          <p className="text-xs text-red-500 mt-1">Au moins 6 caractères requis</p>
        )}
      </div>

      {/* Confirm new password */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Confirmer le nouveau mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••"
            className={`${inputBase} ${confirmPassword && !passwordsMatch ? "border-red-400 dark:border-red-500" : confirmPassword && passwordsMatch ? "border-green-400 dark:border-green-500" : ""}`}
          />
          {confirmPassword && passwordsMatch && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          )}
        </div>
        {confirmPassword && !passwordsMatch && (
          <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={handleClose}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} loading={loading} disabled={!canSubmit}>
          Changer le mot de passe
        </Button>
      </div>
    </Modal>
  );
}
