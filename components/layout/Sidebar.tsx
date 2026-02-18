"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Cloud,
  FolderOpen,
  LayoutDashboard,
  Share2,
  Activity,
  LogOut,
  Star,
  Tag,
  ChevronDown,
  ChevronRight,
  Users,
  HardDrive,
  Key,
  Settings,
} from "lucide-react";
import ThemeToggle from "../theme/ThemeToggle";
import NotificationBell from "./NotificationBell";

const navItems = [
  { href: "/dashboard", label: "Fichiers", icon: FolderOpen },
  { href: "/dashboard/favorites", label: "Favoris", icon: Star },
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/shares", label: "Liens partagés", icon: Share2 },
  { href: "/admin/activity", label: "Activité", icon: Activity },
];

const adminItems = [
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/backup", label: "Backups", icon: HardDrive },
  { href: "/admin/api-keys", label: "Clés API", icon: Key },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

interface TagData {
  id: string;
  name: string;
  color: string;
  _count?: { files: number };
}

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [tags, setTags] = useState<TagData[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags)
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    onNavigate?.();
  };

  const handleLinkClick = () => {
    onNavigate?.();
  };

  const isAdminActive = adminItems.some((i) => pathname === i.href);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/10 transition-colors">
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
          <Cloud className="w-5 h-5 text-gray-700 dark:text-white" />
        </div>
        <span className="text-gray-900 dark:text-white font-semibold flex-1 text-base">SPB Cloud</span>
        <NotificationBell />
        <ThemeToggle />
      </div>

      {/* Navigation - touch optimized */}
      <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-auto overscroll-contain">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname.startsWith("/dashboard") && !pathname.includes("favorites"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors min-h-[44px] ${
                isActive
                  ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10"
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${item.href === "/dashboard/favorites" && pathname === item.href ? "text-yellow-400" : ""}`} />
              {item.label}
            </Link>
          );
        })}

        {/* Admin Section - toggle does NOT close sidebar */}
        <div className="pt-3">
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className={`flex items-center gap-2 px-3 py-2.5 w-full text-xs transition-colors min-h-[40px] rounded-lg active:bg-gray-50 dark:active:bg-white/5 ${
              isAdminActive ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {showAdmin ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Settings className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider font-medium">Administration</span>
          </button>
          {(showAdmin || isAdminActive) && (
            <div className="space-y-0.5 ml-1">
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-colors min-h-[40px] ${
                    pathname === item.href
                      ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tags Section - toggle does NOT close sidebar */}
        {tags.length > 0 && (
          <div className="pt-3">
            <button
              onClick={() => setShowTags(!showTags)}
              className="flex items-center gap-2 px-3 py-2.5 w-full text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-h-[40px] rounded-lg active:bg-gray-50 dark:active:bg-white/5"
            >
              {showTags ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <Tag className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider font-medium">Tags</span>
            </button>
            {showTags && (
              <div className="space-y-0.5 ml-1">
                {tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/dashboard?tagId=${tag.id}`}
                    onClick={handleLinkClick}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 rounded-xl transition-colors min-h-[40px]"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="truncate">{tag.name}</span>
                    {tag._count && <span className="text-xs text-gray-400 dark:text-gray-600 ml-auto tabular-nums">{tag._count.files}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/5 active:bg-red-100 dark:active:bg-red-500/10 transition-colors w-full min-h-[44px]"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
