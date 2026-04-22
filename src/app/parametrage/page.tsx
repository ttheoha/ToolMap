"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CategoriesManager from "@/components/CategoriesManager";
import GridPlan from "@/components/GridPlan";
import LocationsManager from "@/components/LocationsManager";
import BackupRestore from "@/components/BackupRestore";
import ImportCSV from "@/components/ImportCSV";
import ThemeToggle from "@/components/ThemeToggle";

function ParametrageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"plan" | "lieux" | "categories" | "backup">("plan");
  const initialLieu = searchParams.get("lieu") || undefined;
  const initialEmplacement = searchParams.get("emplacement") || undefined;

  useEffect(() => {
    if (initialLieu) setTab("plan");
  }, [initialLieu]);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-accent">Paramétrage</h1>
      </div>

      <ThemeToggle />

      <div className="flex gap-2 border-b border-garage-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setTab("plan")}
          className={`px-3 md:px-4 py-2 rounded-t-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${
            tab === "plan" ? "bg-accent text-white" : "text-garage-400 hover:text-garage-200"
          }`}
        >
          Plan 2D
        </button>
        <button
          onClick={() => setTab("lieux")}
          className={`px-3 md:px-4 py-2 rounded-t-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${
            tab === "lieux" ? "bg-accent text-white" : "text-garage-400 hover:text-garage-200"
          }`}
        >
          Lieux
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`px-3 md:px-4 py-2 rounded-t-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${
            tab === "categories" ? "bg-accent text-white" : "text-garage-400 hover:text-garage-200"
          }`}
        >
          Catégories
        </button>
        <button
          onClick={() => setTab("backup")}
          className={`px-3 md:px-4 py-2 rounded-t-lg font-medium transition-colors text-sm md:text-base whitespace-nowrap ${
            tab === "backup" ? "bg-accent text-white" : "text-garage-400 hover:text-garage-200"
          }`}
        >
          Sauvegarde
        </button>
      </div>

      {tab === "plan" && <GridPlan initialLieu={initialLieu} initialEmplacement={initialEmplacement} />}
      {tab === "lieux" && <LocationsManager />}
      {tab === "categories" && <CategoriesManager />}
      {tab === "backup" && (
        <div className="space-y-6">
          <BackupRestore />
          <ImportCSV />
        </div>
      )}
    </>
  );
}

export default function ParametragePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="text-garage-400 text-center py-8">Chargement...</div>}>
        <ParametrageContent />
      </Suspense>
    </div>
  );
}
