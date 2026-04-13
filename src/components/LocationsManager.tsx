"use client";

import { useState, useEffect, useCallback } from "react";

interface Lieu {
  id: number;
  name: string;
}

export default function LocationsManager() {
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [showLieuForm, setShowLieuForm] = useState(false);
  const [editLieu, setEditLieu] = useState<Lieu | null>(null);
  const [lieuName, setLieuName] = useState("");
  const [lieuError, setLieuError] = useState("");

  const loadLieux = useCallback(() => {
    fetch("/api/lieux").then(r => r.json()).then(setLieux);
  }, []);

  useEffect(() => { loadLieux(); }, [loadLieux]);

  const resetLieuForm = () => {
    setEditLieu(null);
    setLieuName("");
    setLieuError("");
    setShowLieuForm(false);
  };

  const openEditLieu = (l: Lieu) => {
    setEditLieu(l);
    setLieuName(l.name);
    setLieuError("");
    setShowLieuForm(true);
  };

  const handleLieuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lieuName.trim()) return;
    setLieuError("");

    const url = editLieu ? `/api/lieux/${editLieu.id}` : "/api/lieux";
    const method = editLieu ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: lieuName.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setLieuError(data.error || "Erreur");
      return;
    }

    resetLieuForm();
    loadLieux();
  };

  const handleDeleteLieu = async (l: Lieu) => {
    if (!confirm(`Supprimer le lieu "${l.name}" ?`)) return;

    const res = await fetch(`/api/lieux/${l.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erreur lors de la suppression");
      return;
    }
    loadLieux();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-garage-200">Lieux</h2>
        <button onClick={() => { resetLieuForm(); setShowLieuForm(true); }} className="btn-primary text-sm">
          + Ajouter un lieu
        </button>
      </div>

      {showLieuForm && (
        <form onSubmit={handleLieuSubmit} className="card space-y-3">
          <h3 className="font-semibold text-sm text-accent">
            {editLieu ? "Modifier le lieu" : "Nouveau lieu"}
          </h3>
          {lieuError && <p className="text-red-400 text-sm">{lieuError}</p>}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-garage-300 mb-1">Nom du lieu</label>
              <input
                value={lieuName}
                onChange={e => setLieuName(e.target.value)}
                placeholder="Ex: Garage, Grange, Cabane..."
                className="input-field w-full"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary text-sm">{editLieu ? "Modifier" : "Créer"}</button>
            <button type="button" onClick={resetLieuForm} className="btn-secondary text-sm">Annuler</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {lieux.length === 0 ? (
          <p className="text-garage-500 text-sm">Aucun lieu défini. Ajoutez-en un pour commencer.</p>
        ) : (
          lieux.map(l => (
            <div key={l.id} className="flex items-center gap-1 bg-garage-700 rounded-lg px-3 py-1.5 text-sm">
              <span className="text-garage-200 font-medium">{l.name}</span>
              <button onClick={() => openEditLieu(l)} className="text-garage-400 hover:text-accent ml-2" title="Modifier">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => handleDeleteLieu(l)} className="text-garage-400 hover:text-red-400" title="Supprimer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
