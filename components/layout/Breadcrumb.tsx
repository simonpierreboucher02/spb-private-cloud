"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto pb-1 flex-nowrap scrollbar-none">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap py-1 flex-shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Fichiers</span>
      </Link>
      {items.map((item) => (
        <span key={item.id} className="flex items-center gap-1 flex-shrink-0">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
          <Link
            href={`/dashboard/folder/${item.id}`}
            className="hover:text-gray-900 dark:hover:text-white transition-colors whitespace-nowrap py-1"
          >
            {item.name}
          </Link>
        </span>
      ))}
    </nav>
  );
}
