import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import mime from "mime-types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId");
  const search = searchParams.get("search");
  const type = searchParams.get("type");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sizeMin = searchParams.get("sizeMin");
  const sizeMax = searchParams.get("sizeMax");

  const favorite = searchParams.get("favorite");
  const tagId = searchParams.get("tagId");

  const where: Record<string, unknown> = {};

  // When filtering by favorite or tag, don't filter by folder
  if (favorite === "true") {
    where.metadata = { isFavorite: true };
  } else if (tagId) {
    where.tags = { some: { tagId } };
  } else if (folderId === "root" || folderId === null) {
    where.folderId = null;
  } else if (folderId) {
    where.folderId = folderId;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (type) {
    where.mimeType = { startsWith: type };
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
  }

  if (sizeMin || sizeMax) {
    where.size = {};
    if (sizeMin) (where.size as Record<string, unknown>).gte = BigInt(sizeMin);
    if (sizeMax) (where.size as Record<string, unknown>).lte = BigInt(sizeMax);
  }

  const files = await prisma.file.findMany({
    where,
    orderBy: { [sortBy]: order },
    include: {
      folder: true,
      metadata: true,
      tags: { include: { tag: true } },
      _count: { select: { versions: true } },
    },
  });

  const serialized = files.map((f) => ({
    ...f,
    size: Number(f.size),
  }));

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folderId = formData.get("folderId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const maxSize = parseInt(process.env.MAX_FILE_SIZE || "104857600");
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large. Max ${Math.round(maxSize / 1024 / 1024)}MB` },
      { status: 413 }
    );
  }

  // Quota check for shared spaces
  if (folderId && folderId !== "root") {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (folder?.sharedSpaceId) {
      const space = await prisma.sharedSpace.findUnique({ where: { id: folder.sharedSpaceId } });
      if (space) {
        const agg = await prisma.file.aggregate({
          _sum: { size: true },
          where: { folder: { sharedSpaceId: folder.sharedSpaceId } },
        });
        const usedBytes = Number(agg._sum.size || 0);
        if (usedBytes + file.size > Number(space.quotaBytes)) {
          return NextResponse.json({ error: "Quota de l'espace partagé dépassé (500 Go max)" }, { status: 413 });
        }
      }
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = mime.lookup(file.name) || file.type || "application/octet-stream";
  const { storagePath, size } = await saveFile(buffer, file.name);

  const dbFile = await prisma.file.create({
    data: {
      name: file.name,
      storagePath,
      size: BigInt(size),
      mimeType,
      folderId: folderId && folderId !== "root" ? folderId : null,
    },
  });

  await logActivity("UPLOAD", dbFile.id, `Uploaded ${file.name}`);

  return NextResponse.json(
    { ...dbFile, size: Number(dbFile.size) },
    { status: 201 }
  );
}
