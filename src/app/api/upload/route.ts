import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    const { photo } = await request.json();

    if (!photo || typeof photo !== "string") {
      return NextResponse.json({ error: "Photo manquante" }, { status: 400 });
    }

    // Extract base64 data and extension
    const match = photo.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Format de photo invalide" }, { status: 400 });
    }

    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const buffer = Buffer.from(match[2], "base64");

    // Check size (2 Mo max)
    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "La photo ne doit pas dépasser 2 Mo" }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}.${ext}`;
    await writeFile(path.join(UPLOADS_DIR, filename), buffer);

    return NextResponse.json({ path: `/uploads/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { path: filePath } = await request.json();

    if (!filePath || typeof filePath !== "string" || !filePath.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), "public", filePath);
    await unlink(fullPath).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
