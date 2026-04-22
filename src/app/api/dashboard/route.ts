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

  // Consommables en stock bas (quantity <= minStock) ou vides
  const allConsommables = await prisma.item.findMany({
    where: {
      reference: "Consommables",
      status: { in: ["actif", "vide"] },
      OR: [
        { minStock: { not: null } },
        { status: "vide" },
        { quantity: 0 },
      ],
    },
    include: {
      category: { select: { name: true } },
      location: { select: { lieu: true, emplacement: true, ligne: true, colonne: true } },
    },
    orderBy: { quantity: "asc" },
  });

  const lowStockConsommables = allConsommables
    .filter(c => c.status === "vide" || c.quantity === 0 || (c.minStock !== null && c.quantity <= c.minStock))
    .map(c => ({
      id: c.id,
      name: c.name,
      quantity: c.quantity,
      minStock: c.minStock,
      unit: c.unit,
      status: c.status,
      category: c.category.name,
      location: c.location
        ? `${c.location.lieu} - ${c.location.emplacement}-${c.location.ligne}${c.location.colonne}`
        : null,
    }));

  // Stats
  const totalItems = await prisma.item.count({ where: { status: "actif" } });
  const totalOutils = await prisma.item.count({ where: { reference: "Outils", status: "actif" } });
  const totalMateriels = await prisma.item.count({ where: { reference: "Materiels", status: "actif" } });
  const totalConsommables = await prisma.item.count({ where: { reference: "Consommables", status: "actif" } });

  return NextResponse.json({
    topOutils: topOutils.map((i) => ({ name: i.name, value: i._count.history })),
    topConsommables: topConsommables.map((i) => ({ name: i.name, value: i._count.history })),
    activeLoans,
    lowStockConsommables,
    stats: { totalItems, totalOutils, totalMateriels, totalConsommables },
  });
}
