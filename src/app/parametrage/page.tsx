"use client";

import { useState } from "react";
import CategoriesManager from "@/components/CategoriesManager";
import GridPlan from "@/components/GridPlan";

export default function ParametragePage() {
  const [tab, setTab] = useState<"plan" | "categories">("plan");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-accent">Paramétrage</h1>

      <div className="flex gap-2 border-b border-garage-700 pb-2">
        <button
          onClick={() => setTab("plan")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            tab === "plan" ? "bg-accent text-white" : "text-garage-400 hover:text-garage-200"
          }`}
        >
          Plan 2D des casiers
        </button>
        <button
          onClick={() => setTab("categories")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            tab === "categories" ? "bg-accent text-white" : "text-garage-400 hover:text-garage-200"
          }`}
        >
          Catégories
        </button>
      </div>

      {tab === "plan" && <GridPlan />}
      {tab === "categories" && <CategoriesManager />}
    </div>
  );
}
