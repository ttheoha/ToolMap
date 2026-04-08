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

  const renderMovements = (list: Movement[]) => (
    <div className="max-h-[60vh] overflow-y-auto space-y-1">
      {list.length === 0 ? (
        <p className="text-garage-500 text-sm text-center py-4">Aucun mouvement</p>
      ) : (
        list.map(m => (
          <div key={m.id} className="flex items-center gap-3 text-sm bg-garage-700/50 rounded px-3 py-2">
            <span className="text-garage-500 text-xs shrink-0 w-32">{new Date(m.createdAt).toLocaleString("fr-FR")}</span>
            <span className="font-medium text-garage-200 shrink-0 w-32 truncate">{m.item.name}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${
              m.type === "Ajout" ? "bg-green-900 text-green-300" :
              m.type === "Suppression" ? "bg-red-900 text-red-300" :
              m.type === "Pret" ? "bg-blue-900 text-blue-300" :
              m.type === "Rendu" ? "bg-cyan-900 text-cyan-300" :
              m.type === "Vendu" ? "bg-purple-900 text-purple-300" :
              m.type === "Vide" ? "bg-yellow-900 text-yellow-300" :
              "bg-garage-600 text-garage-200"
            }`}>{m.type}</span>
            <span className="text-garage-400 truncate">{m.description}</span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <div className="flex gap-2">
        <button onClick={() => setShowLog(true)} className="btn-secondary text-sm">
          Historique des mouvements
        </button>
        <button onClick={() => setShowHidden(true)} className="btn-secondary text-sm">
          Historique masqué (Vendu/Vide)
        </button>
      </div>

      <Modal isOpen={showLog} onClose={() => setShowLog(false)} title="Historique des mouvements" size="xl">
        <input placeholder="Filtrer..." value={search} onChange={e => setSearch(e.target.value)} className="input-field w-full mb-4" />
        {renderMovements(movements)}
      </Modal>

      <Modal isOpen={showHidden} onClose={() => setShowHidden(false)} title="Historique masqué (Vendu / Vide)" size="xl">
        <input placeholder="Filtrer..." value={searchHidden} onChange={e => setSearchHidden(e.target.value)} className="input-field w-full mb-4" />
        {renderMovements(hiddenMovements)}
      </Modal>
    </>
  );
}
