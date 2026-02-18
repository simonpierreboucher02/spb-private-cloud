import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { getFilePath } from "./storage";
import { prisma } from "./prisma";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const masterKey = process.env.ENCRYPTION_KEY || "default-encryption-key-change-me!";
  return scryptSync(masterKey, "spb-cloud-salt", 32);
}

export async function encryptFile(fileId: string): Promise<boolean> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file || file.isEncrypted) return false;

  const filePath = getFilePath(file.storagePath);
  if (!existsSync(filePath)) return false;

  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const plaintext = readFileSync(filePath);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([authTag, encrypted]);
  writeFileSync(filePath, combined);

  await prisma.file.update({ where: { id: fileId }, data: { isEncrypted: true, encryptionIV: iv.toString("hex") } });
  return true;
}

export async function decryptFile(fileId: string): Promise<Buffer | null> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file || !file.isEncrypted || !file.encryptionIV) return null;

  const filePath = getFilePath(file.storagePath);
  if (!existsSync(filePath)) return null;

  const key = getKey();
  const iv = Buffer.from(file.encryptionIV, "hex");
  const combined = readFileSync(filePath);
  const authTag = combined.subarray(0, 16);
  const encrypted = combined.subarray(16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export async function removeEncryption(fileId: string): Promise<boolean> {
  const decrypted = await decryptFile(fileId);
  if (!decrypted) return false;

  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return false;

  const filePath = getFilePath(file.storagePath);
  writeFileSync(filePath, decrypted);
  await prisma.file.update({ where: { id: fileId }, data: { isEncrypted: false, encryptionIV: null } });
  return true;
}
