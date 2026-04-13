import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const locationId = parseInt(id);

  const existing = await prisma.location.findUnique({ where: { id: locationId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const location = await prisma.location.update({
    where: { id: locationId },
    data: {
      lieu: body.lieu ?? existing.lieu,
      emplacement: body.emplacement ?? existing.emplacement,
      ligne: body.ligne ?? existing.ligne,
      colonne: body.colonne ?? existing.colonne,
    },
  });

  return NextResponse.json(location);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const locationId = parseInt(id);

  // Check if items are assigned to this location
  const itemCount = await prisma.item.count({ where: { locationId } });
  if (itemCount > 0) {
    return NextResponse.json(
      { error: `Impossible de supprimer : ${itemCount} article(s) assigné(s) à cet emplacement` },
      { status: 400 }
    );
  }

  await prisma.location.delete({ where: { id: locationId } });
  return NextResponse.json({ success: true });
}
