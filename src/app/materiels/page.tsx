"use client";

import ItemListPage from "@/components/ItemListPage";
import MovementLog from "@/components/MovementLog";

export default function MaterielsPage() {
  return (
    <div className="space-y-6">
      <ItemListPage reference="Materiels" title="Matériels" />
      <div className="border-t border-garage-700 pt-4">
        <MovementLog reference="Materiels" />
      </div>
    </div>
  );
}
