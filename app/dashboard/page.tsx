"use client";

import AppShell from "@/components/layout/AppShell";
import FileExplorer from "@/components/files/FileExplorer";

export default function DashboardPage() {
  return (
    <AppShell>
      <FileExplorer />
    </AppShell>
  );
}
