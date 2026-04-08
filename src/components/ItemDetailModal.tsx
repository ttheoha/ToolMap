"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import ImageZoom from "./ImageZoom";

interface ItemDetail {
  id: number;
  name: string;
  reference: string;
  photo: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  status: string;
  category: { id: number; name: string };
  location: { id: number; lieu: string; emplacement: string; ligne: string; colonne: number } | null;
  history: { id: number; type: string; description: string | null; createdAt: string }[];
  loans: { id: number; firstName: string; lastName: string; loanDate: string; expectedReturn: string; actualReturn: string | null; status: string }[];
}

interface Props {
  itemId: number | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ItemDetailModal({ itemId, onClose, onRefresh }: Props) {
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loanForm, setLoanForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");

  useEffect(() => {
    if (itemId) {
      fetch(`/api/items/${itemId}`).then(r => r.json()).then(setItem);
    } else {
      setItem(null);
    }
  }, [itemId]);

  const handleStatusChange = async (status: string) => {
    if (!item) return;
    if (!confirm(`Confirmer le changement de statut vers "${status}" ?`)) return;
    await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onRefresh();
    onClose();
  };

  const handleLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, firstName, lastName, expectedReturn }),
    });
    setLoanForm(false);
    setFirstName("");
    setLastName("");
    setExpectedReturn("");
    onRefresh();
    // Refresh item detail
    const updated = await fetch(`/api/items/${item.id}`).then(r => r.json());
    setItem(updated);
  };

  const handleReturnLoan = async (loanId: number) => {
    await fetch(`/api/loans/${loanId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rendu" }),
    });
    onRefresh();
    if (item) {
      const updated = await fetch(`/api/items/${item.id}`).then(r => r.json());
      setItem(updated);
    }
  };

  if (!item) return null;

  return (
    <Modal isOpen={!!itemId} onClose={onClose} title={item.name} size="xl">
      <div className="space-y-6">
        {/* Header info */}
        <div className="flex gap-6">
          <div className="shrink-0">
            <ImageZoom src={item.photo || ""} alt={item.name} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">{item.reference}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-garage-600 text-garage-200">{item.category.name}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                item.status === "actif" ? "bg-green-900 text-green-300" :
                item.status === "vendu" ? "bg-red-900 text-red-300" :
                "bg-yellow-900 text-yellow-300"
              }`}>{item.status}</span>
            </div>
            <p className="text-garage-300 text-sm">{item.description || "Aucune description"}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-garage-400">Quantité:</span> {item.quantity} {item.unit}</div>
              <div><span className="text-garage-400">Emplacement:</span> {item.location ? `${item.location.lieu} - ${item.location.emplacement}-${item.location.ligne}${item.location.colonne}` : "Non assigné"}</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {item.status === "actif" && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setLoanForm(!loanForm)} className="btn-primary text-sm">Prêter</button>
            {item.reference === "Materiels" && (
              <button onClick={() => handleStatusChange("vendu")} className="btn-danger text-sm">Marquer Vendu</button>
            )}
            {item.reference === "Consommables" && (
              <button onClick={() => handleStatusChange("vide")} className="btn-danger text-sm">Marquer Vide</button>
            )}
          </div>
        )}

        {/* Loan form */}
        {loanForm && (
          <form onSubmit={handleLoan} className="card space-y-3">
            <h3 className="font-semibold text-sm text-accent">Nouveau prêt</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} className="input-field" required />
              <input placeholder="Nom" value={lastName} onChange={e => setLastName(e.target.value)} className="input-field" required />
            </div>
            <input type="date" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} className="input-field w-full" required />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm">Confirmer le prêt</button>
              <button type="button" onClick={() => setLoanForm(false)} className="btn-secondary text-sm">Annuler</button>
            </div>
          </form>
        )}

        {/* Active loans */}
        {item.loans.filter(l => l.status === "en_cours").length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-accent mb-2">Prêts en cours</h3>
            <div className="space-y-2">
              {item.loans.filter(l => l.status === "en_cours").map(loan => (
                <div key={loan.id} className="flex items-center justify-between bg-garage-700 rounded-lg px-3 py-2 text-sm">
                  <span>{loan.firstName} {loan.lastName} — retour prévu: {new Date(loan.expectedReturn).toLocaleDateString("fr-FR")}</span>
                  <button onClick={() => handleReturnLoan(loan.id)} className="btn-primary text-xs py-1 px-2">Rendu</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div>
          <h3 className="font-semibold text-sm text-accent mb-2">Historique</h3>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {item.history.length === 0 ? (
              <p className="text-garage-500 text-sm">Aucun mouvement</p>
            ) : (
              item.history.map(h => (
                <div key={h.id} className="flex items-center gap-3 text-sm bg-garage-700/50 rounded px-3 py-1.5">
                  <span className="text-garage-500 text-xs shrink-0">{new Date(h.createdAt).toLocaleString("fr-FR")}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${
                    h.type === "Ajout" ? "bg-green-900 text-green-300" :
                    h.type === "Suppression" ? "bg-red-900 text-red-300" :
                    h.type === "Pret" ? "bg-blue-900 text-blue-300" :
                    h.type === "Rendu" ? "bg-cyan-900 text-cyan-300" :
                    h.type === "Vendu" ? "bg-purple-900 text-purple-300" :
                    h.type === "Vide" ? "bg-yellow-900 text-yellow-300" :
                    "bg-garage-600 text-garage-200"
                  }`}>{h.type}</span>
                  <span className="text-garage-300 truncate">{h.description}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
