"use client";

import AppShell from "@/components/layout/AppShell";
import UserManagement from "@/components/admin/UserManagement";

export default function UsersPage() {
  return (
    <AppShell>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les utilisateurs de votre cloud</p>
        </div>
        <UserManagement />
      </div>
    </AppShell>
  );
}
