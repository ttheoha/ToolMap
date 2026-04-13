import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const lieux = await prisma.lieu.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(lieux);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }

  const existing = await prisma.lieu.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "Ce lieu existe déjà" }, { status: 400 });
  }

  const lieu = await prisma.lieu.create({ data: { name } });
  return NextResponse.json(lieu, { status: 201 });
}
