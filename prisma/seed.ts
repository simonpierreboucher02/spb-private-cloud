import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { id: "admin" },
    update: { passwordHash, role: "admin", name: "Admin", email: "admin@spbcloud.local" },
    create: {
      id: "admin",
      passwordHash,
      role: "admin",
      name: "Admin",
      email: "admin@spbcloud.local",
    },
  });

  console.log("Seed completed: admin user created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
