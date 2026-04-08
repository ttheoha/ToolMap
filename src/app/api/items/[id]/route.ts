import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id: parseInt(id) },
    include: {
      category: true,
      location: true,
      history: { orderBy: { createdAt: "desc" } },
      loans: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const itemId = parseInt(id);

  const changes: string[] = [];
  const existing = await prisma.item.findUnique({ where: { id: itemId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.name && body.name !== existing.name) changes.push(`Nom: ${existing.name} → ${body.name}`);
  if (body.quantity !== undefined && body.quantity !== existing.quantity) changes.push(`Quantité: ${existing.quantity} → ${body.quantity}`);
  if (body.categoryId && body.categoryId !== existing.categoryId) changes.push(`Catégorie modifiée`);
  if (body.locationId !== undefined && body.locationId !== existing.locationId) changes.push(`Emplacement modifié`);

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      name: body.name ?? existing.name,
      reference: body.reference ?? existing.reference,
      photo: body.photo !== undefined ? body.photo : existing.photo,
      description: body.description !== undefined ? body.description : existing.description,
      quantity: body.quantity ?? existing.quantity,
      unit: body.unit ?? existing.unit,
      categoryId: body.categoryId ?? existing.categoryId,
      locationId: body.locationId !== undefined ? body.locationId : existing.locationId,
      status: body.status ?? existing.status,
    },
    include: { category: true, location: true },
  });

  if (body.status && body.status !== existing.status) {
    const typeMap: Record<string, string> = { vendu: "Vendu", vide: "Vide" };
    await prisma.movement.create({
      data: {
        itemId,
        type: typeMap[body.status] || "Modif",
        description: `Statut changé vers "${body.status}"`,
      },
    });
  } else if (changes.length > 0) {
    await prisma.movement.create({
      data: {
        itemId,
        type: "Modif",
        description: changes.join(", "),
      },
    });
  }

  return NextResponse.json(item);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseInt(id);
  const item = await prisma.item.findUnique({ where: { id: itemId } });

  if (item) {
    await prisma.movement.create({
      data: {
        itemId,
        type: "Suppression",
        description: `Suppression de "${item.name}"`,
      },
    });
  }

  await prisma.item.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
