import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const type = sp.get("type");
  const search = sp.get("search");
  const hidden = sp.get("hidden");

  const where: Record<string, unknown> = {};

  if (type) where.type = type;

  if (hidden === "true") {
    where.type = { in: ["Vendu", "Vide"] };
  }

  if (search) {
    where.OR = [
      { description: { contains: search } },
      { item: { name: { contains: search } } },
      { type: { contains: search } },
    ];
  }

  const page = sp.get("page") ? parseInt(sp.get("page")!) : null;
  const limit = sp.get("limit") ? parseInt(sp.get("limit")!) : 50;

  if (page) {
    const [movements, total] = await Promise.all([
      prisma.movement.findMany({
        where,
        include: { item: { select: { id: true, name: true, reference: true, status: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.movement.count({ where }),
    ]);
    return NextResponse.json({ movements, total, page, totalPages: Math.ceil(total / limit) });
  }

  const movements = await prisma.movement.findMany({
    where,
    include: { item: { select: { id: true, name: true, reference: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(movements);
}
