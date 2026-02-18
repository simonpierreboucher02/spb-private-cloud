"use client";

import AppShell from "@/components/layout/AppShell";
import ApiKeyManager from "@/components/admin/ApiKeyManager";

export default function ApiKeysPage() {
  return (
    <AppShell>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Clés API</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez l&apos;accès à l&apos;API REST publique</p>
        </div>
        <ApiKeyManager />
      </div>
    </AppShell>
  );
}
