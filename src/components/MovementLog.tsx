"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";

interface Movement {
  id: number;
  type: string;
  description: string | null;
  createdAt: string;
  item: { id: number; name: string; reference: string; status: string } | null;
}

const MOVEMENTS_PER_PAGE = 50;

export default function MovementLog({ reference }: { reference: string }) {
  const [showLog, setShowLog] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [hiddenMovements, setHiddenMovements] = useState<Movement[]>([]);
  const [search, setSearch] = useState("");
  const [searchHidden, setSearchHidden] = useState("");
  const [restockId, setRestockId] = useState<number | null>(null);
  const [restockQty, setRestockQty] = useState(1);
  const [movPage, setMovPage] = useState(1);
  const [movTotalPages, setMovTotalPages] = useState(1);
  const [hiddenPage, setHiddenPage] = useState(1);
  const [hiddenTotalPages, setHiddenTotalPages] = useState(1);

  useEffect(() => {
    if (showLog) {
      const params = new URLSearchParams({ page: String(movPage), limit: String(MOVEMENTS_PER_PAGE) });
      if (search) params.set("search", search);
      fetch(`/api/movements?${params}`).then(r => r.json()).then((data: { movements: Movement[]; totalPages: number }) => {
        setMovements(data.movements.filter(m =>
          m.item ? m.item.reference === reference : (m.description?.includes(reference) ?? false)
        ));
        setMovTotalPages(data.totalPages);
      });
    }
  }, [showLog, search, reference, movPage]);

  useEffect(() => { setMovPage(1); }, [search]);

  useEffect(() => {
    if (showHidden) {
      const params = new URLSearchParams({ hidden: "true", page: String(hiddenPage), limit: String(MOVEMENTS_PER_PAGE) });
      if (searchHidden) params.set("search", searchHidden);
      fetch(`/api/movements?${params}`).then(r => r.json()).then((data: { movements: Movement[]; totalPages: number }) => {
        setHiddenMovements(data.movements.filter(m =>
          m.item ? m.item.reference === reference : (m.description?.includes(reference) ?? false)
        ));
        setHiddenTotalPages(data.totalPages);
      });
    }
  }, [showHidden, searchHidden, reference, hiddenPage]);

  useEffect(() => { setHiddenPage(1); }, [searchHidden]);

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
    const params = new URLSearchParams({ hidden: "true", page: String(hiddenPage), limit: String(MOVEMENTS_PER_PAGE) });
    if (searchHidden) params.set("search", searchHidden);
    const data: { movements: Movement[]; totalPages: number } = await fetch(`/api/movements?${params}`).then(r => r.json());
    setHiddenMovements(data.movements.filter(m =>
      m.item ? m.item.reference === reference : (m.description?.includes(reference) ?? false)
    ));
    setHiddenTotalPages(data.totalPages);
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
              <span className="font-medium text-garage-200 shrink-0 sm:w-32 truncate">{m.item?.name ?? "—"}</span>
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
              {isHidden && m.item && m.type === "Vide" && m.item.status === "vide" && (
                <button
                  onClick={() => { setRestockId(restockId === m.item!.id ? null : m.item!.id); setRestockQty(1); }}
                  className="btn-primary text-xs py-1 px-2 shrink-0"
                >
                  Réapprovisionné
                </button>
              )}
            </div>
            {isHidden && m.item && restockId === m.item.id && m.type === "Vide" && m.item.status === "vide" && (
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
        {movTotalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setMovPage(p => Math.max(1, p - 1))} disabled={movPage === 1} className="btn-secondary text-sm disabled:opacity-40">Précédent</button>
            <span className="text-sm text-garage-300">Page {movPage}/{movTotalPages}</span>
            <button onClick={() => setMovPage(p => Math.min(movTotalPages, p + 1))} disabled={movPage === movTotalPages} className="btn-secondary text-sm disabled:opacity-40">Suivant</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showHidden} onClose={() => setShowHidden(false)} title="Historique masqué (Vendu / Vide)" size="xl">
        <div className="flex gap-3 mb-4">
          <input placeholder="Filtrer..." value={searchHidden} onChange={e => setSearchHidden(e.target.value)} className="input-field flex-1" />
          <button onClick={() => exportCSV(true)} className="btn-secondary text-sm whitespace-nowrap">
            Exporter CSV
          </button>
        </div>
        {renderMovements(hiddenMovements, true)}
        {hiddenTotalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setHiddenPage(p => Math.max(1, p - 1))} disabled={hiddenPage === 1} className="btn-secondary text-sm disabled:opacity-40">Précédent</button>
            <span className="text-sm text-garage-300">Page {hiddenPage}/{hiddenTotalPages}</span>
            <button onClick={() => setHiddenPage(p => Math.min(hiddenTotalPages, p + 1))} disabled={hiddenPage === hiddenTotalPages} className="btn-secondary text-sm disabled:opacity-40">Suivant</button>
          </div>
        )}
      </Modal>
    </>
  );
}
