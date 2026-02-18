"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import FileExplorer from "@/components/files/FileExplorer";
import Breadcrumb from "@/components/layout/Breadcrumb";

interface BreadcrumbItem {
  id: string;
  name: string;
}

export default function FolderPage() {
  const params = useParams();
  const folderId = params.id as string;
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    async function fetchBreadcrumbs() {
      const res = await fetch(`/api/folders/${folderId}`);
      if (res.ok) {
        const data = await res.json();
        const crumbs: BreadcrumbItem[] = [];

        // Build breadcrumb path
        let current = data;
        const visited = new Set<string>();
        while (current) {
          if (visited.has(current.id)) break;
          visited.add(current.id);
          crumbs.unshift({ id: current.id, name: current.name });
          current = current.parent;
        }
        setBreadcrumbs(crumbs);
      }
    }
    fetchBreadcrumbs();
  }, [folderId]);

  return (
    <AppShell>
      <div className="px-4 lg:px-6 pt-4">
        <Breadcrumb items={breadcrumbs} />
      </div>
      <FileExplorer folderId={folderId} />
    </AppShell>
  );
}
