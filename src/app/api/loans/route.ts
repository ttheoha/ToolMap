import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const where = status ? { status } : {};
  const loans = await prisma.loan.findMany({
    where,
    include: { item: { select: { id: true, name: true, reference: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(loans);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const loan = await prisma.loan.create({
    data: {
      itemId: body.itemId,
      firstName: body.firstName,
      lastName: body.lastName,
      expectedReturn: new Date(body.expectedReturn),
    },
    include: { item: true },
  });

  await prisma.movement.create({
    data: {
      itemId: body.itemId,
      type: "Pret",
      description: `Prêt à ${body.firstName} ${body.lastName} - retour prévu le ${new Date(body.expectedReturn).toLocaleDateString("fr-FR")}`,
    },
  });

  return NextResponse.json(loan, { status: 201 });
}
