"use client";

import AppShell from "@/components/layout/AppShell";
import BackupPanel from "@/components/admin/BackupPanel";

export default function BackupPage() {
  return (
    <AppShell>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Backups</h1>
          <p className="text-sm text-gray-500 mt-1">Sauvegardez et restaurez vos données</p>
        </div>
        <BackupPanel />
      </div>
    </AppShell>
  );
}
