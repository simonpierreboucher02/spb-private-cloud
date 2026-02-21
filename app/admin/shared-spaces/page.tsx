"use client";

import AppShell from "@/components/layout/AppShell";
import SharedSpaceManagement from "@/components/admin/SharedSpaceManagement";

export default function SharedSpacesPage() {
  return (
    <AppShell>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Espaces partagés</h1>
          <p className="text-sm text-gray-500 mt-1">Créez des clouds partagés entre utilisateurs · 500 Go par espace</p>
        </div>
        <SharedSpaceManagement />
      </div>
    </AppShell>
  );
}
