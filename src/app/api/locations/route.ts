import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const lieu = request.nextUrl.searchParams.get("lieu");
  const emplacement = request.nextUrl.searchParams.get("emplacement");
  const where: Record<string, unknown> = {};
  if (lieu) where.lieu = lieu;
  if (emplacement) where.emplacement = emplacement;

  const locations = await prisma.location.findMany({
    where,
    include: { _count: { select: { items: true } } },
    orderBy: [{ lieu: "asc" }, { emplacement: "asc" }, { ligne: "asc" }, { colonne: "asc" }],
  });
  return NextResponse.json(locations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const location = await prisma.location.create({
    data: {
      lieu: body.lieu,
      emplacement: body.emplacement,
      ligne: body.ligne,
      colonne: body.colonne,
    },
  });
  return NextResponse.json(location, { status: 201 });
}
