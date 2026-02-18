import { createReadStream, createWriteStream, existsSync, mkdirSync } from "fs";
import { unlink, copyFile, readdir, rm, stat } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { ReadStream } from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const FILES_DIR = path.join(UPLOAD_DIR, "files");
const CHUNKS_DIR = path.join(UPLOAD_DIR, "chunks");
const VERSIONS_DIR = path.join(UPLOAD_DIR, "versions");

// Ensure directories exist
[FILES_DIR, CHUNKS_DIR, VERSIONS_DIR].forEach((dir) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

function getExtension(filename: string): string {
  const ext = path.extname(filename);
  return ext || "";
}

export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<{ storagePath: string; size: number }> {
  const ext = getExtension(originalName);
  const storagePath = `${uuidv4()}${ext}`;
  const fullPath = path.join(FILES_DIR, storagePath);

  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(fullPath);
    stream.write(buffer);
    stream.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return { storagePath, size: buffer.length };
}

export async function saveChunk(
  buffer: Buffer,
  uploadId: string,
  chunkIndex: number
): Promise<void> {
  const chunkDir = path.join(CHUNKS_DIR, uploadId);
  if (!existsSync(chunkDir)) mkdirSync(chunkDir, { recursive: true });

  const chunkPath = path.join(chunkDir, `chunk-${chunkIndex}`);
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(chunkPath);
    stream.write(buffer);
    stream.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

export async function assembleChunks(
  uploadId: string,
  totalChunks: number,
  originalName: string
): Promise<{ storagePath: string; size: number }> {
  const ext = getExtension(originalName);
  const storagePath = `${uuidv4()}${ext}`;
  const fullPath = path.join(FILES_DIR, storagePath);
  const chunkDir = path.join(CHUNKS_DIR, uploadId);

  const writeStream = createWriteStream(fullPath);
  let totalSize = 0;

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(chunkDir, `chunk-${i}`);
    const chunkBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const readStream = createReadStream(chunkPath);
      readStream.on("data", (chunk) => chunks.push(chunk as Buffer));
      readStream.on("end", () => resolve(Buffer.concat(chunks)));
      readStream.on("error", reject);
    });
    writeStream.write(chunkBuffer);
    totalSize += chunkBuffer.length;
  }

  await new Promise<void>((resolve) => writeStream.end(resolve));

  // Clean up chunks
  await rm(chunkDir, { recursive: true, force: true });

  return { storagePath, size: totalSize };
}

export async function deleteFile(storagePath: string): Promise<void> {
  const fullPath = path.join(FILES_DIR, storagePath);
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

export async function duplicateFile(
  storagePath: string,
  originalName: string
): Promise<{ storagePath: string; size: number }> {
  const ext = getExtension(originalName);
  const newStoragePath = `${uuidv4()}${ext}`;
  const srcPath = path.join(FILES_DIR, storagePath);
  const destPath = path.join(FILES_DIR, newStoragePath);

  await copyFile(srcPath, destPath);
  const stats = await stat(destPath);

  return { storagePath: newStoragePath, size: Number(stats.size) };
}

export function getFilePath(storagePath: string): string {
  return path.resolve(FILES_DIR, storagePath);
}

export function getFileStream(storagePath: string): ReadStream {
  const fullPath = path.join(FILES_DIR, storagePath);
  return createReadStream(fullPath);
}

export async function getStorageUsage(): Promise<{
  totalSize: number;
  fileCount: number;
}> {
  let totalSize = 0;
  let fileCount = 0;

  if (existsSync(FILES_DIR)) {
    const files = await readdir(FILES_DIR);
    for (const file of files) {
      const filePath = path.join(FILES_DIR, file);
      const stats = await stat(filePath);
      totalSize += stats.size;
      fileCount++;
    }
  }

  return { totalSize, fileCount };
}

// --- Version management ---

export async function saveVersion(
  currentStoragePath: string,
  originalName: string
): Promise<{ storagePath: string; size: number }> {
  const ext = getExtension(originalName);
  const versionStoragePath = `${uuidv4()}${ext}`;
  const srcPath = path.join(FILES_DIR, currentStoragePath);
  const destPath = path.join(VERSIONS_DIR, versionStoragePath);

  await copyFile(srcPath, destPath);
  const stats = await stat(destPath);

  return { storagePath: versionStoragePath, size: Number(stats.size) };
}

export function getVersionPath(storagePath: string): string {
  return path.resolve(VERSIONS_DIR, storagePath);
}

export async function deleteVersion(storagePath: string): Promise<void> {
  const fullPath = path.join(VERSIONS_DIR, storagePath);
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

export async function restoreVersion(
  versionStoragePath: string,
  currentStoragePath: string
): Promise<void> {
  const srcPath = path.join(VERSIONS_DIR, versionStoragePath);
  const destPath = path.join(FILES_DIR, currentStoragePath);
  await copyFile(srcPath, destPath);
}

export async function saveFileFromBuffer(
  buffer: Buffer,
  storagePath: string
): Promise<void> {
  const fullPath = path.join(FILES_DIR, storagePath);
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(fullPath);
    stream.write(buffer);
    stream.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}
