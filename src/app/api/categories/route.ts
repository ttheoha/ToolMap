import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("reference");
  const where = ref ? { reference: ref } : {};
  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const category = await prisma.category.create({
    data: { name: body.name, reference: body.reference },
  });
  return NextResponse.json(category, { status: 201 });
}
