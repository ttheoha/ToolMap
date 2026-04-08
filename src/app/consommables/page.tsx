"use client";

import ItemListPage from "@/components/ItemListPage";
import MovementLog from "@/components/MovementLog";

export default function ConsommablesPage() {
  return (
    <div className="space-y-6">
      <ItemListPage reference="Consommables" title="Consommables" />
      <div className="border-t border-garage-700 pt-4">
        <MovementLog reference="Consommables" />
      </div>
    </div>
  );
}
