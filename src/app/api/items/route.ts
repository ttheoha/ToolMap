import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const reference = sp.get("reference");
  const categoryId = sp.get("categoryId");
  const search = sp.get("search");
  const status = sp.get("status") || "actif";
  const locationId = sp.get("locationId");

  const where: Record<string, unknown> = {};

  if (reference) where.reference = reference;
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (status === "hidden") {
    where.status = { in: ["vendu", "vide"] };
  } else {
    where.status = status;
  }
  if (locationId) where.locationId = parseInt(locationId);
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { category: { name: { contains: search } } },
      { reference: { contains: search } },
    ];
  }

  const items = await prisma.item.findMany({
    where,
    include: {
      category: true,
      location: true,
      _count: { select: { loans: { where: { status: "en_cours" } } } },
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  // Deduplicate by ID
  const seen = new Set<number>();
  const unique = items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  return NextResponse.json(unique);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const item = await prisma.item.create({
    data: {
      name: body.name,
      reference: body.reference,
      photo: body.photo || null,
      description: body.description || null,
      quantity: body.quantity || 1,
      unit: body.unit || "unitaire",
      categoryId: body.categoryId,
      locationId: body.locationId || null,
      status: "actif",
    },
    include: { category: true, location: true },
  });

  await prisma.movement.create({
    data: {
      itemId: item.id,
      type: "Ajout",
      description: `Ajout de "${item.name}" (${item.reference})`,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
