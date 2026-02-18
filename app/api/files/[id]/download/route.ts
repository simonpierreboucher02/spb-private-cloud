import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFilePath } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { stat } from "fs/promises";
import { createReadStream } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const file = await prisma.file.findUnique({ where: { id: params.id } });

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const filePath = getFilePath(file.storagePath);
  const fileStat = await stat(filePath);
  const fileSize = fileStat.size;

  await logActivity("DOWNLOAD", file.id, `Downloaded ${file.name}`);

  const stream = createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => controller.enqueue(chunk));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
      "Content-Length": String(fileSize),
    },
  });
}
