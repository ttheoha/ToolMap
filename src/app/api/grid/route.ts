import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const lieu = request.nextUrl.searchParams.get("lieu");
  const where = lieu ? { lieu } : {};
  const grids = await prisma.gridConfig.findMany({ where, orderBy: { emplacement: "asc" } });
  return NextResponse.json(grids);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { lieu, emplacement, rows, cols } = body;

  // Upsert grid config
  const grid = await prisma.gridConfig.upsert({
    where: { lieu_emplacement: { lieu, emplacement } },
    update: { rows, cols },
    create: { lieu, emplacement, rows, cols },
  });

  // Create locations for each cell
  for (let r = 0; r < rows; r++) {
    const ligne = String.fromCharCode(65 + r); // A, B, C...
    for (let c = 1; c <= cols; c++) {
      await prisma.location.upsert({
        where: {
          lieu_emplacement_ligne_colonne: { lieu, emplacement, ligne, colonne: c },
        },
        update: {},
        create: { lieu, emplacement, ligne, colonne: c },
      });
    }
  }

  return NextResponse.json(grid, { status: 201 });
}
