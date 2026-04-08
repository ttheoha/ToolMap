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

  const movements = await prisma.movement.findMany({
    where,
    include: { item: { select: { id: true, name: true, reference: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return NextResponse.json(movements);
}
