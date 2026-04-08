"use client";

import ItemListPage from "@/components/ItemListPage";
import MovementLog from "@/components/MovementLog";

export default function OutilsPage() {
  return (
    <div className="space-y-6">
      <ItemListPage reference="Outils" title="Outils" />
      <div className="border-t border-garage-700 pt-4">
        <MovementLog reference="Outils" />
      </div>
    </div>
  );
}
