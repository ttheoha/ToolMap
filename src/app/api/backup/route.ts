import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1gb",
    },
  },
};

// Export full database as JSON
export async function GET() {
  const [categories, lieux, items, locations, gridConfigs, movements, loans] = await Promise.all([
    prisma.category.findMany(),
    prisma.lieu.findMany(),
    prisma.item.findMany(),
    prisma.location.findMany(),
    prisma.gridConfig.findMany(),
    prisma.movement.findMany(),
    prisma.loan.findMany(),
  ]);

  // Embed photo files as base64 in backup
  const itemsWithPhotos = await Promise.all(
    items.map(async (item) => {
      if (item.photo && item.photo.startsWith("/uploads/")) {
        try {
          const filePath = path.join(process.cwd(), "public", item.photo);
          const buffer = await readFile(filePath);
          const ext = path.extname(item.photo).slice(1);
          const mime = ext === "jpg" ? "jpeg" : ext;
          return { ...item, _photoBase64: `data:image/${mime};base64,${buffer.toString("base64")}` };
        } catch {
          return item;
        }
      }
      return item;
    })
  );

  const backup = {
    version: "1.0",
    date: new Date().toISOString(),
    data: { categories, lieux, locations, gridConfigs, items: itemsWithPhotos, movements, loans },
  };

  const json = JSON.stringify(backup, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="toolmap_backup_${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

// Restore database from JSON backup
export async function POST(request: NextRequest) {
  try {
    const backup = await request.json();

    if (!backup.data) {
      return NextResponse.json({ error: "Format de sauvegarde invalide" }, { status: 400 });
    }

    const { categories, lieux, locations, gridConfigs, items, movements, loans } = backup.data;

    // Delete all existing data in reverse dependency order
    await prisma.movement.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.item.deleteMany();
    await prisma.location.deleteMany();
    await prisma.gridConfig.deleteMany();
    await prisma.category.deleteMany();
    await prisma.lieu.deleteMany();

    // Restore in dependency order
    if (categories?.length) {
      await prisma.category.createMany({ data: categories.map((c: Record<string, unknown>) => ({
        id: c.id as number,
        name: c.name as string,
        reference: c.reference as string,
        createdAt: new Date(c.createdAt as string),
      }))});
    }

    if (lieux?.length) {
      await prisma.lieu.createMany({ data: lieux.map((l: Record<string, unknown>) => ({
        id: l.id as number,
        name: l.name as string,
        createdAt: new Date(l.createdAt as string),
      }))});
    }

    if (locations?.length) {
      await prisma.location.createMany({ data: locations.map((l: Record<string, unknown>) => ({
        id: l.id as number,
        lieu: l.lieu as string,
        emplacement: l.emplacement as string,
        ligne: l.ligne as string,
        colonne: l.colonne as number,
        createdAt: new Date(l.createdAt as string),
      }))});
    }

    if (gridConfigs?.length) {
      await prisma.gridConfig.createMany({ data: gridConfigs.map((g: Record<string, unknown>) => ({
        id: g.id as number,
        lieu: g.lieu as string,
        emplacement: g.emplacement as string,
        rows: g.rows as number,
        cols: g.cols as number,
        createdAt: new Date(g.createdAt as string),
      }))});
    }

    if (items?.length) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadsDir, { recursive: true });

      // Helper to write base64 image to disk
      const saveBase64ToDisk = async (base64: string): Promise<string | null> => {
        try {
          const match = base64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/s);
          if (!match) return null;
          const ext = match[1] === "jpeg" ? "jpg" : match[1].replace("+", "");
          const buffer = Buffer.from(match[2], "base64");
          if (buffer.length < 100) return null; // Skip truncated/corrupt data
          const filename = `${crypto.randomUUID()}.${ext}`;
          await writeFile(path.join(uploadsDir, filename), buffer);
          return `/uploads/${filename}`;
        } catch {
          return null;
        }
      };

      // Restore photos from base64 to filesystem
      const itemsData = await Promise.all(items.map(async (i: Record<string, unknown>) => {
        let photo = (i.photo as string) || null;
        const photoBase64 = i._photoBase64 as string | undefined;

        if (photoBase64) {
          // Backup contains embedded base64 photo — write it to disk
          const saved = await saveBase64ToDisk(photoBase64);
          if (saved) photo = saved;
        } else if (photo && photo.startsWith("data:image/")) {
          // Legacy backup with base64 directly in photo field — write to disk
          const saved = await saveBase64ToDisk(photo);
          if (saved) photo = saved;
          else photo = null; // Truncated/corrupt — discard
        }

        return {
          id: i.id as number,
          name: i.name as string,
          reference: i.reference as string,
          photo,
          description: (i.description as string) || null,
          quantity: i.quantity as number,
          minStock: i.minStock != null ? Number(i.minStock) : null,
          unit: i.unit as string,
          categoryId: i.categoryId as number,
          locationId: i.locationId != null ? Number(i.locationId) : null,
          status: i.status as string,
          createdAt: new Date(i.createdAt as string),
          updatedAt: new Date(i.updatedAt as string),
        };
      }));

      await prisma.item.createMany({ data: itemsData });
    }

    if (movements?.length) {
      await prisma.movement.createMany({ data: movements.map((m: Record<string, unknown>) => ({
        id: m.id as number,
        itemId: m.itemId as number,
        type: m.type as string,
        description: (m.description as string) || null,
        createdAt: new Date(m.createdAt as string),
      }))});
    }

    if (loans?.length) {
      await prisma.loan.createMany({ data: loans.map((l: Record<string, unknown>) => ({
        id: l.id as number,
        itemId: l.itemId as number,
        firstName: l.firstName as string,
        lastName: l.lastName as string,
        loanDate: new Date(l.loanDate as string),
        expectedReturn: new Date(l.expectedReturn as string),
        actualReturn: l.actualReturn ? new Date(l.actualReturn as string) : null,
        status: l.status as string,
        createdAt: new Date(l.createdAt as string),
      }))});
    }

    return NextResponse.json({ success: true, message: "Restauration terminée" });
  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: "Erreur lors de la restauration" }, { status: 500 });
  }
}
