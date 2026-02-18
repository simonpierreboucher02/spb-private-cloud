import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorageUsage } from "@/lib/storage";

export async function GET() {
  const [fileCount, folderCount, shareCount, recentActivity, storageUsage] =
    await Promise.all([
      prisma.file.count(),
      prisma.folder.count(),
      prisma.sharedLink.count({ where: { active: true } }),
      prisma.activityLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { file: { select: { name: true } } },
      }),
      getStorageUsage(),
    ]);

  // File type breakdown
  const filesByType = await prisma.file.groupBy({
    by: ["mimeType"],
    _count: true,
    _sum: { size: true },
  });

  const typeBreakdown = filesByType.map((t) => ({
    type: t.mimeType,
    count: t._count,
    size: Number(t._sum.size || 0),
  }));

  return NextResponse.json({
    fileCount,
    folderCount,
    shareCount,
    storageUsed: storageUsage.totalSize,
    diskFileCount: storageUsage.fileCount,
    recentActivity,
    typeBreakdown,
  });
}
