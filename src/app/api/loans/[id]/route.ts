import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const loanId = parseInt(id);

  const loan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      status: body.status,
      actualReturn: body.status === "rendu" ? new Date() : undefined,
    },
    include: { item: true },
  });

  if (body.status === "rendu") {
    await prisma.movement.create({
      data: {
        itemId: loan.itemId,
        type: "Rendu",
        description: `Retour de prêt par ${loan.firstName} ${loan.lastName}`,
      },
    });
  }

  return NextResponse.json(loan);
}
