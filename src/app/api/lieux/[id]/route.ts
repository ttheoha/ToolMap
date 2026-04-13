import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const lieuId = parseInt(id);
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const existing = await prisma.lieu.findUnique({ where: { id: lieuId } });
  if (!existing) {
    return NextResponse.json({ error: "Lieu non trouvé" }, { status: 404 });
  }

  // Check for duplicate name
  const duplicate = await prisma.lieu.findUnique({ where: { name } });
  if (duplicate && duplicate.id !== lieuId) {
    return NextResponse.json({ error: "Ce nom de lieu existe déjà" }, { status: 400 });
  }

  // Update lieu name and cascade to locations and grid configs
  const oldName = existing.name;
  const [lieu] = await prisma.$transaction([
    prisma.lieu.update({ where: { id: lieuId }, data: { name } }),
    prisma.location.updateMany({ where: { lieu: oldName }, data: { lieu: name } }),
    prisma.gridConfig.updateMany({ where: { lieu: oldName }, data: { lieu: name } }),
  ]);

  return NextResponse.json(lieu);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lieuId = parseInt(id);

  const existing = await prisma.lieu.findUnique({ where: { id: lieuId } });
  if (!existing) {
    return NextResponse.json({ error: "Lieu non trouvé" }, { status: 404 });
  }

  // Check if locations use this lieu
  const locationCount = await prisma.location.count({ where: { lieu: existing.name } });
  if (locationCount > 0) {
    return NextResponse.json(
      { error: `Impossible de supprimer : ${locationCount} emplacement(s) utilisent ce lieu` },
      { status: 400 }
    );
  }

  await prisma.lieu.delete({ where: { id: lieuId } });
  return NextResponse.json({ success: true });
}
