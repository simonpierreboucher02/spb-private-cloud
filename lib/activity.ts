import { prisma } from "./prisma";

export async function logActivity(
  action: string,
  fileId?: string | null,
  details?: string
) {
  await prisma.activityLog.create({
    data: {
      action,
      fileId: fileId || null,
      details: details || null,
    },
  });
}
