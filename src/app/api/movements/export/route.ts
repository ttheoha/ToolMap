import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const reference = sp.get("reference");
  const hidden = sp.get("hidden");

  const where: Record<string, unknown> = {};

  if (hidden === "true") {
    where.type = { in: ["Vendu", "Vide"] };
  }

  const movements = await prisma.movement.findMany({
    where,
    include: { item: { select: { id: true, name: true, reference: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Filter by reference client-side if needed
  const filtered = reference
    ? movements.filter(m => m.item?.reference === reference || (!m.item && m.description?.includes(reference)))
    : movements;

  // Build CSV
  const header = "Date,Article,Reference,Type,Description,Statut";
  const rows = filtered.map(m => {
    const date = new Date(m.createdAt).toLocaleString("fr-FR");
    const name = `"${(m.item?.name || "—").replace(/"/g, '""')}"`;
    const ref = m.item?.reference || "—";
    const type = m.type;
    const desc = `"${(m.description || "").replace(/"/g, '""')}"`;
    const status = m.item?.status || "supprimé";
    return `${date},${name},${ref},${type},${desc},${status}`;
  });

  const csv = "\uFEFF" + [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="historique_${reference || "all"}_${hidden === "true" ? "masque" : "mouvements"}.csv"`,
    },
  });
}
