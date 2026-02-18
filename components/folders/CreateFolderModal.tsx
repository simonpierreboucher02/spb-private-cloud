"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import toast from "react-hot-toast";

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  onCreated: () => void;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  parentId,
  onCreated,
}: CreateFolderModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          parentId: parentId || "root",
        }),
      });

      if (res.ok) {
        toast.success("Dossier créé");
        setName("");
        onCreated();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau dossier">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nom du dossier"
        className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-white/20 mb-4"
        autoFocus
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
      />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={handleCreate} loading={loading} disabled={!name.trim()}>
          Créer
        </Button>
      </div>
    </Modal>
  );
}
