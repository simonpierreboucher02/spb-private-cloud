"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import StatsCards from "@/components/admin/StatsCards";
import ActivityLog from "@/components/admin/ActivityLog";
import StorageChart from "@/components/admin/StorageChart";

interface Stats {
  fileCount: number;
  folderCount: number;
  shareCount: number;
  storageUsed: number;
  diskFileCount: number;
  recentActivity: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    file: { name: string } | null;
  }>;
  typeBreakdown: Array<{
    type: string;
    count: number;
    size: number;
  }>;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de votre cloud</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Storage Chart */}
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors">
                <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Répartition du stockage
                </h2>
                <StorageChart
                  data={stats.typeBreakdown}
                  totalSize={stats.storageUsed}
                />
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-6 shadow-sm dark:shadow-none transition-colors">
                <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Activité récente
                </h2>
                <div className="max-h-80 overflow-y-auto">
                  <ActivityLog activities={stats.recentActivity} />
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Impossible de charger les stats</p>
        )}
      </div>
    </AppShell>
  );
}
