import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { rows, reference } = await request.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à importer" }, { status: 400 });
    }

    if (!reference) {
      return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // +2 for header + 0-index

      if (!row.name || !row.category) {
        errors.push(`Ligne ${lineNum}: nom ou catégorie manquant`);
        skipped++;
        continue;
      }

      try {
        // Find or create category
        let category = await prisma.category.findFirst({
          where: { name: row.category, reference },
        });
        if (!category) {
          category = await prisma.category.create({
            data: { name: row.category, reference },
          });
        }

        // Create item
        await prisma.item.create({
          data: {
            name: row.name,
            reference,
            description: row.description || null,
            quantity: row.quantity ? parseInt(row.quantity) : 1,
            unit: row.unit || "unitaire",
            categoryId: category.id,
            status: "actif",
          },
        });

        await prisma.movement.create({
          data: {
            itemId: (await prisma.item.findFirst({ where: { name: row.name, categoryId: category.id }, orderBy: { id: "desc" } }))!.id,
            type: "Ajout",
            description: `Import CSV: "${row.name}"`,
          },
        });

        imported++;
      } catch (err) {
        errors.push(`Ligne ${lineNum}: ${err instanceof Error ? err.message : "erreur"}`);
        skipped++;
      }
    }

    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 20) });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 });
  }
}
