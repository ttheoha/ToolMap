import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { action, ids, categoryId, locationId } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Aucun élément sélectionné" }, { status: 400 });
  }

  switch (action) {
    case "delete": {
      // Record movements before deletion
      const items = await prisma.item.findMany({ where: { id: { in: ids } } });
      for (const item of items) {
        await prisma.movement.create({
          data: { itemId: item.id, type: "Suppression", description: `Suppression groupée de "${item.name}"` },
        });
      }
      await prisma.item.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ success: true, affected: items.length });
    }

    case "move": {
      if (locationId === undefined) {
        return NextResponse.json({ error: "locationId requis" }, { status: 400 });
      }
      const result = await prisma.item.updateMany({
        where: { id: { in: ids } },
        data: { locationId: locationId || null },
      });
      return NextResponse.json({ success: true, affected: result.count });
    }

    case "category": {
      if (!categoryId) {
        return NextResponse.json({ error: "categoryId requis" }, { status: 400 });
      }
      const result = await prisma.item.updateMany({
        where: { id: { in: ids } },
        data: { categoryId },
      });
      return NextResponse.json({ success: true, affected: result.count });
    }

    default:
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }
}
