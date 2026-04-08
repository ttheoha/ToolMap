import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Catégories Outils
  const outilsCategories = [
    "Clés", "Tournevis", "Pinces", "Marteaux", "Scies",
    "Mesure", "Douilles", "Limes", "Extracteurs", "Électroportatif",
  ];

  // Catégories Matériels
  const materielsCategories = [
    "Levage", "Soudure", "Diagnostic", "Pneumatique", "Éclairage",
    "Nettoyage", "Rangement", "Protection", "Électrique", "Hydraulique",
  ];

  // Catégories Consommables
  const consommablesCategories = [
    "Huiles", "Filtres", "Visserie", "Joints", "Adhésifs",
    "Abrasifs", "Lubrifiants", "Peinture", "Électricité", "Nettoyants",
  ];

  for (const name of outilsCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, reference: "Outils" },
    });
  }

  for (const name of materielsCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, reference: "Materiels" },
    });
  }

  for (const name of consommablesCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, reference: "Consommables" },
    });
  }

  console.log("✅ Seed completed: categories created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
