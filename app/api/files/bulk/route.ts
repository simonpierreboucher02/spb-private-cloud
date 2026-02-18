import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { deleteFile, getFilePath } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { encryptFile, removeEncryption } from "@/lib/encryption";
import JSZip from "jszip";
import { readFileSync, existsSync } from "fs";

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, fileIds } = body as { action: string; fileIds: string[] };

  if (!action || !fileIds?.length) return NextResponse.json({ error: "action and fileIds required" }, { status: 400 });

  if (action === "delete") {
    const files = await prisma.file.findMany({ where: { id: { in: fileIds } } });
    for (const file of files) {
      await deleteFile(file.storagePath);
      await prisma.file.delete({ where: { id: file.id } });
      await logActivity("DELETE", file.id, `Bulk delete: ${file.name}`);
    }
    return NextResponse.json({ success: true, count: files.length });
  }

  if (action === "move") {
    const { targetFolderId } = body;
    await prisma.file.updateMany({
      where: { id: { in: fileIds } },
      data: { folderId: targetFolderId === "root" ? null : targetFolderId },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "download") {
    const files = await prisma.file.findMany({ where: { id: { in: fileIds } } });
    const zip = new JSZip();
    for (const file of files) {
      const filePath = getFilePath(file.storagePath);
      if (existsSync(filePath)) {
        zip.file(file.name, readFileSync(filePath));
      }
    }
    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    return new NextResponse(buffer, {
      headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="files.zip"` },
    });
  }

  if (action === "encrypt") {
    let count = 0;
    for (const id of fileIds) {
      const ok = await encryptFile(id);
      if (ok) count++;
    }
    return NextResponse.json({ success: true, count });
  }

  if (action === "decrypt") {
    let count = 0;
    for (const id of fileIds) {
      const ok = await removeEncryption(id);
      if (ok) count++;
    }
    return NextResponse.json({ success: true, count });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
