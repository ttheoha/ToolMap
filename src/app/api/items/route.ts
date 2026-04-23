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
  if (locationId === "none") {
    where.locationId = null;
  } else if (locationId) {
    where.locationId = parseInt(locationId);
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { category: { name: { contains: search } } },
      { reference: { contains: search } },
    ];
  }

  const page = sp.get("page") ? parseInt(sp.get("page")!) : null;
  const limit = sp.get("limit") ? parseInt(sp.get("limit")!) : null;

  const orderBy = [{ category: { name: "asc" as const } }, { name: "asc" as const }];

  if (page && limit) {
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: true,
          location: true,
          _count: { select: { loans: { where: { status: "en_cours" } } } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);
    return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  }

  const items = await prisma.item.findMany({
    where,
    include: {
      category: true,
      location: true,
      _count: { select: { loans: { where: { status: "en_cours" } } } },
    },
    orderBy,
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
      minStock: body.minStock !== undefined ? body.minStock : null,
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
