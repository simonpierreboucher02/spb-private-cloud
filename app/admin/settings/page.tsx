"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import TwoFactorSetup from "@/components/admin/TwoFactorSetup";

export default function SettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setTwoFactorEnabled(data.twoFactorEnabled || false);
      }
    } catch {}
  };

  useEffect(() => { fetchStatus(); }, []);

  return (
    <AppShell>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Paramètres</h1>
          <p className="text-sm text-gray-500 mt-1">Sécurité et préférences</p>
        </div>

        <TwoFactorSetup enabled={twoFactorEnabled} onStatusChange={fetchStatus} />
      </div>
    </AppShell>
  );
}
