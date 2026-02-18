import { existsSync, mkdirSync, createWriteStream, readdirSync, statSync } from "fs";
import { rm } from "fs/promises";
import path from "path";
import archiver from "archiver";
import { prisma } from "./prisma";

const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

export async function createBackup(type: "full" | "incremental" = "full"): Promise<{ id: string; path: string; size: number }> {
  const log = await prisma.backupLog.create({ data: { status: "running", type } });

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(BACKUP_DIR, `backup-${type}-${timestamp}.zip`);
    const output = createWriteStream(backupPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    const completed = new Promise<number>((resolve, reject) => {
      output.on("close", () => resolve(archive.pointer()));
      archive.on("error", reject);
    });

    archive.pipe(output);
    if (existsSync(UPLOAD_DIR)) archive.directory(UPLOAD_DIR, "uploads");
    const dbPath = path.resolve("./prisma/dev.db");
    if (existsSync(dbPath)) archive.file(dbPath, { name: "database/dev.db" });
    await archive.finalize();
    const size = await completed;

    await prisma.backupLog.update({ where: { id: log.id }, data: { status: "completed", path: backupPath, size: BigInt(size), completedAt: new Date() } });
    return { id: log.id, path: backupPath, size };
  } catch (error) {
    await prisma.backupLog.update({ where: { id: log.id }, data: { status: "failed", error: (error as Error).message, completedAt: new Date() } });
    throw error;
  }
}

export async function listBackups() {
  const logs = await prisma.backupLog.findMany({ orderBy: { startedAt: "desc" }, take: 50 });
  return logs.map((l) => ({ id: l.id, status: l.status, type: l.type, size: l.size ? Number(l.size) : 0, path: l.path, startedAt: l.startedAt, completedAt: l.completedAt }));
}

export async function deleteBackup(id: string): Promise<boolean> {
  const log = await prisma.backupLog.findUnique({ where: { id } });
  if (!log) return false;
  if (log.path && existsSync(log.path)) await rm(log.path);
  await prisma.backupLog.delete({ where: { id } });
  return true;
}

export function getBackupStats() {
  if (!existsSync(BACKUP_DIR)) return { count: 0, totalSize: 0 };
  const files = readdirSync(BACKUP_DIR);
  let totalSize = 0;
  for (const file of files) totalSize += statSync(path.join(BACKUP_DIR, file)).size;
  return { count: files.length, totalSize };
}
