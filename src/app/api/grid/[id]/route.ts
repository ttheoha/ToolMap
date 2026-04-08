import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { rows, cols } = body;
  const gridId = parseInt(id);

  const existing = await prisma.gridConfig.findUnique({ where: { id: gridId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { lieu, emplacement } = existing;

  // Update grid config
  const grid = await prisma.gridConfig.update({
    where: { id: gridId },
    data: { rows, cols },
  });

  // Remove locations that are outside the new grid
  const oldLocations = await prisma.location.findMany({
    where: { lieu, emplacement },
  });

  for (const loc of oldLocations) {
    const rowIndex = loc.ligne.charCodeAt(0) - 65;
    if (rowIndex >= rows || loc.colonne > cols) {
      // Detach items from this location before deleting
      await prisma.item.updateMany({
        where: { locationId: loc.id },
        data: { locationId: null },
      });
      await prisma.location.delete({ where: { id: loc.id } });
    }
  }

  // Create new locations for expanded cells
  for (let r = 0; r < rows; r++) {
    const ligne = String.fromCharCode(65 + r);
    for (let c = 1; c <= cols; c++) {
      await prisma.location.upsert({
        where: { lieu_emplacement_ligne_colonne: { lieu, emplacement, ligne, colonne: c } },
        update: {},
        create: { lieu, emplacement, ligne, colonne: c },
      });
    }
  }

  return NextResponse.json(grid);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gridId = parseInt(id);

  const existing = await prisma.gridConfig.findUnique({ where: { id: gridId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { lieu, emplacement } = existing;

  // Detach all items from locations in this grid (set locationId to null)
  const locationIds = await prisma.location.findMany({
    where: { lieu, emplacement },
    select: { id: true },
  });

  if (locationIds.length > 0) {
    await prisma.item.updateMany({
      where: { locationId: { in: locationIds.map(l => l.id) } },
      data: { locationId: null },
    });
  }

  // Delete all locations for this grid
  await prisma.location.deleteMany({ where: { lieu, emplacement } });

  // Delete grid config
  await prisma.gridConfig.delete({ where: { id: gridId } });

  return NextResponse.json({ success: true });
}
