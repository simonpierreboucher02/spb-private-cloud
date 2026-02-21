"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import ThemeToggle from "../theme/ThemeToggle";
import NotificationBell from "./NotificationBell";
import AiPanel from "../ai/AiPanel";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-[#0a0a0a] flex transition-colors">
      {/* Desktop Sidebar — fixed height, scrolls independently */}
      <div className="hidden lg:flex flex-col w-64 flex-shrink-0 h-full overflow-y-auto">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <MobileNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content — fills remaining space, scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] transition-colors safe-top shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-3 -ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center active:bg-gray-100 dark:active:bg-white/10 rounded-xl transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-gray-900 dark:text-white font-semibold text-base">SPB Cloud</span>
          <div className="flex items-center gap-0">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto pb-safe min-h-0">
          {children}
        </main>
      </div>

      {/* AI Assistant */}
      <AiPanel />
    </div>
  );
}
