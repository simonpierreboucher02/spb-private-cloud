import { prisma } from "./prisma";

export async function createNotification(userId: string, type: string, title: string, message: string, data?: Record<string, unknown>) {
  return prisma.notification.create({ data: { userId, type, title, message, data: data ? JSON.stringify(data) : null } });
}

export async function getNotifications(userId: string, unreadOnly = false) {
  const where: Record<string, unknown> = { userId };
  if (unreadOnly) where.read = false;
  return prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
}

export async function markAsRead(notificationId: string) {
  return prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function notifyUploadComplete(userId: string, fileName: string, fileId: string) {
  return createNotification(userId, "upload_complete", "Upload terminé", `${fileName} uploadé avec succès`, { fileId });
}

export async function notifyBackupComplete(userId: string, backupId: string) {
  return createNotification(userId, "backup_complete", "Backup terminé", "Le backup a été créé avec succès", { backupId });
}

export async function notifyAiComplete(userId: string, fileName: string, action: string) {
  return createNotification(userId, "ai_complete", "Analyse IA", `${action} terminée pour ${fileName}`);
}
