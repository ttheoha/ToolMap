/**
 * Migration script: converts base64 photos stored in the database to files on disk.
 * Run BEFORE changing the schema column type.
 *
 * Usage: npx tsx scripts/migrate-photos.ts
 */

import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function main() {
  await mkdir(UPLOADS_DIR, { recursive: true });

  const items = await prisma.item.findMany({
    where: { photo: { not: null } },
    select: { id: true, photo: true },
  });

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    if (!item.photo) {
      skipped++;
      continue;
    }

    // Already a file path — skip
    if (item.photo.includes("/uploads/")) {
      skipped++;
      continue;
    }

    // Must be base64
    const match = item.photo.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) {
      console.warn(`  [SKIP] Item ${item.id}: photo is not base64 and not a file path`);
      skipped++;
      continue;
    }

    try {
      const ext = match[1] === "jpeg" ? "jpg" : match[1].replace("+", "");
      const buffer = Buffer.from(match[2], "base64");
      const filename = `${crypto.randomUUID()}.${ext}`;
      const filePath = `/api/uploads/${filename}`;

      await writeFile(path.join(UPLOADS_DIR, filename), buffer);

      await prisma.item.update({
        where: { id: item.id },
        data: { photo: filePath },
      });

      console.log(`  [OK] Item ${item.id}: ${buffer.length} bytes -> ${filePath}`);
      migrated++;
    } catch (err) {
      console.error(`  [ERR] Item ${item.id}:`, err);
      failed++;
    }
  }

  console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped, ${failed} failed (total: ${items.length})`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
