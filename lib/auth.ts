import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export async function verifyPassword(password: string, email?: string): Promise<{ valid: boolean; user: { id: string; role: string; twoFactorEnabled: boolean } | null }> {
  let user;
  if (email) {
    user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { valid: false, user: null };
    const valid = await bcrypt.compare(password, user.passwordHash);
    return { valid, user: valid ? { id: user.id, role: user.role, twoFactorEnabled: user.twoFactorEnabled } : null };
  }

  // Legacy: try all users (for simple password-only login)
  const users = await prisma.user.findMany();
  for (const u of users) {
    const match = await bcrypt.compare(password, u.passwordHash);
    if (match) {
      return { valid: true, user: { id: u.id, role: u.role, twoFactorEnabled: u.twoFactorEnabled } };
    }
  }
  return { valid: false, user: null };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, twoFactorEnabled: true, createdAt: true },
  });
}

export async function requireAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.role === "admin";
}
