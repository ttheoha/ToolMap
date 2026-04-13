import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Top 5 outils les plus utilisés (par nombre de mouvements)
  const topOutils = await prisma.item.findMany({
    where: { reference: "Outils", status: "actif" },
    include: { _count: { select: { history: true } } },
    orderBy: { history: { _count: "desc" } },
    take: 5,
  });

  // Top 5 consommables
  const topConsommables = await prisma.item.findMany({
    where: { reference: "Consommables", status: "actif" },
    include: { _count: { select: { history: true } } },
    orderBy: { history: { _count: "desc" } },
    take: 5,
  });

  // Prêts en cours
  const activeLoans = await prisma.loan.findMany({
    where: { status: "en_cours" },
    include: { item: { select: { id: true, name: true, reference: true } } },
    orderBy: { loanDate: "desc" },
  });

  // Stats
  const totalItems = await prisma.item.count({ where: { status: "actif" } });
  const totalOutils = await prisma.item.count({ where: { reference: "Outils", status: "actif" } });
  const totalMateriels = await prisma.item.count({ where: { reference: "Materiels", status: "actif" } });
  const totalConsommables = await prisma.item.count({ where: { reference: "Consommables", status: "actif" } });

  return NextResponse.json({
    topOutils: topOutils.map((i) => ({ name: i.name, value: i._count.history })),
    topConsommables: topConsommables.map((i) => ({ name: i.name, value: i._count.history })),
    activeLoans,
    stats: { totalItems, totalOutils, totalMateriels, totalConsommables },
  });
}
