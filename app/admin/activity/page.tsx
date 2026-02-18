"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import ActivityLog from "@/components/admin/ActivityLog";
import Button from "@/components/ui/Button";

interface Activity {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  file: { name: string } | null;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchActivity = async (newOffset = 0) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/activity?limit=${limit}&offset=${newOffset}`
      );
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
        setTotal(data.total);
        setOffset(newOffset);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  return (
    <AppShell>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Activité</h1>
          <p className="text-sm text-gray-500 mt-1">
            Historique complet ({total} entrées)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
              <ActivityLog activities={activities} />
            </div>

            {total > limit && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={offset === 0}
                  onClick={() => fetchActivity(Math.max(0, offset - limit))}
                >
                  Précédent
                </Button>
                <span className="text-sm text-gray-500">
                  {offset + 1}-{Math.min(offset + limit, total)} sur {total}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={offset + limit >= total}
                  onClick={() => fetchActivity(offset + limit)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
