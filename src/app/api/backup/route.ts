import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1gb",
    },
  },
};

// Export full database as JSON
export async function GET() {
  const [categories, items, locations, gridConfigs, movements, loans] = await Promise.all([
    prisma.category.findMany(),
    prisma.item.findMany(),
    prisma.location.findMany(),
    prisma.gridConfig.findMany(),
    prisma.movement.findMany(),
    prisma.loan.findMany(),
  ]);

  const backup = {
    version: "1.0",
    date: new Date().toISOString(),
    data: { categories, locations, gridConfigs, items, movements, loans },
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

    const { categories, locations, gridConfigs, items, movements, loans } = backup.data;

    // Delete all existing data in reverse dependency order
    await prisma.movement.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.item.deleteMany();
    await prisma.location.deleteMany();
    await prisma.gridConfig.deleteMany();
    await prisma.category.deleteMany();

    // Restore in dependency order
    if (categories?.length) {
      await prisma.category.createMany({ data: categories.map((c: Record<string, unknown>) => ({
        id: c.id as number,
        name: c.name as string,
        reference: c.reference as string,
        createdAt: new Date(c.createdAt as string),
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
      await prisma.item.createMany({ data: items.map((i: Record<string, unknown>) => ({
        id: i.id as number,
        name: i.name as string,
        reference: i.reference as string,
        photo: (i.photo as string) || null,
        description: (i.description as string) || null,
        quantity: i.quantity as number,
        minStock: (i.minStock as number) || null,
        unit: i.unit as string,
        categoryId: i.categoryId as number,
        locationId: (i.locationId as number) || null,
        status: i.status as string,
        createdAt: new Date(i.createdAt as string),
        updatedAt: new Date(i.updatedAt as string),
      }))});
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
