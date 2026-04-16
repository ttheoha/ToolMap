"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

interface Movement {
  id: number;
  type: string;
  description: string | null;
  createdAt: string;
  item: { id: number; name: string; reference: string; status: string };
}

export default function MovementLog({ reference }: { reference: string }) {
  const [showLog, setShowLog] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [hiddenMovements, setHiddenMovements] = useState<Movement[]>([]);
  const [search, setSearch] = useState("");
  const [searchHidden, setSearchHidden] = useState("");
  const [restockId, setRestockId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState(1);

  useEffect(() => {
    if (showLog) {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      fetch(`/api/movements?${params}`).then(r => r.json()).then((data: Movement[]) => {
        setMovements(data.filter(m => m.item.reference === reference));
      });
    }
  }, [showLog, search, reference]);

  useEffect(() => {
    if (showHidden) {
      const params = new URLSearchParams({ hidden: "true" });
      if (searchHidden) params.set("search", searchHidden);
      fetch(`/api/movements?${params}`).then(r => r.json()).then((data: Movement[]) => {
        setHiddenMovements(data.filter(m => m.item.reference === reference));
      });
    }
  }, [showHidden, searchHidden, reference]);

  const handleRestock = async (itemId: number) => {
    if (restockQty < 1) return;
    await fetch(`/api/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "actif", quantity: restockQty }),
    });
    setRestockId(null);
    setRestockQty(1);
    // Refresh hidden movements
    const params = new URLSearchParams({ hidden: "true" });
    if (searchHidden) params.set("search", searchHidden);
    const data: Movement[] = await fetch(`/api/movements?${params}`).then(r => r.json());
    setHiddenMovements(data.filter(m => m.item.reference === reference));
  };

  const renderMovements = (list: Movement[], isHidden = false) => (
    <div className="max-h-[60vh] overflow-y-auto space-y-1">
      {list.length === 0 ? (
        <p className="text-garage-500 text-sm text-center py-4">Aucun mouvement</p>
      ) : (
        list.map(m => (
          <div key={m.id} className="bg-garage-700/50 rounded px-3 py-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
              <span className="text-garage-500 text-xs shrink-0 w-full sm:w-32">{new Date(m.createdAt).toLocaleString("fr-FR")}</span>
              <span className="font-medium text-garage-200 shrink-0 sm:w-32 truncate">{m.item.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${
                m.type === "Ajout" ? "bg-green-900 text-green-300" :
                m.type === "Suppression" ? "bg-red-900 text-red-300" :
                m.type === "Pret" ? "bg-blue-900 text-blue-300" :
                m.type === "Rendu" ? "bg-cyan-900 text-cyan-300" :
                m.type === "Vendu" ? "bg-purple-900 text-purple-300" :
                m.type === "Vide" ? "bg-yellow-900 text-yellow-300" :
                "bg-garage-600 text-garage-200"
              }`}>{m.type}</span>
              <span className="text-garage-400 truncate flex-1">{m.description}</span>
              {isHidden && m.type === "Vide" && m.item.status === "vide" && (
                <button
                  onClick={() => { setRestockId(restockId === m.item.id ? null : m.item.id); setRestockQty(1); }}
                  className="btn-primary text-xs py-1 px-2 shrink-0"
                >
                  Réapprovisionné
                </button>
              )}
            </div>
            {isHidden && restockId === m.item.id && m.type === "Vide" && m.item.status === "vide" && (
              <div className="flex flex-wrap items-center gap-2 mt-2 sm:ml-32 pl-3">
                <label className="text-xs text-garage-400">Quantité :</label>
                <input
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={e => setRestockQty(Number(e.target.value))}
                  className="input-field w-20 text-sm"
                />
                <button onClick={() => handleRestock(m.item.id)} className="btn-primary text-xs py-1 px-3">
                  Confirmer
                </button>
                <button onClick={() => setRestockId(null)} className="btn-secondary text-xs py-1 px-2">
                  Annuler
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const exportCSV = (hidden: boolean) => {
    const params = new URLSearchParams({ reference });
    if (hidden) params.set("hidden", "true");
    window.open(`/api/movements/export?${params}`, "_blank");
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setShowLog(true)} className="btn-secondary text-sm">
          Historique des mouvements
        </button>
        <button onClick={() => setShowHidden(true)} className="btn-secondary text-sm">
          Historique masqué (Vendu/Vide)
        </button>
      </div>

      <Modal isOpen={showLog} onClose={() => setShowLog(false)} title="Historique des mouvements" size="xl">
        <div className="flex gap-3 mb-4">
          <input placeholder="Filtrer..." value={search} onChange={e => setSearch(e.target.value)} className="input-field flex-1" />
          <button onClick={() => exportCSV(false)} className="btn-secondary text-sm whitespace-nowrap">
            Exporter CSV
          </button>
        </div>
        {renderMovements(movements)}
      </Modal>

      <Modal isOpen={showHidden} onClose={() => setShowHidden(false)} title="Historique masqué (Vendu / Vide)" size="xl">
        <div className="flex gap-3 mb-4">
          <input placeholder="Filtrer..." value={searchHidden} onChange={e => setSearchHidden(e.target.value)} className="input-field flex-1" />
          <button onClick={() => exportCSV(true)} className="btn-secondary text-sm whitespace-nowrap">
            Exporter CSV
          </button>
        </div>
        {renderMovements(hiddenMovements, true)}
      </Modal>
    </>
  );
}
