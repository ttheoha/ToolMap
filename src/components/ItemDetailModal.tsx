"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import ImageZoom from "./ImageZoom";

interface ItemDetail {
  id: number;
  name: string;
  reference: string;
  photo: string | null;
  description: string | null;
  quantity: number;
  minStock: number | null;
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
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [editQty, setEditQty] = useState<number>(0);
  const [editMinStock, setEditMinStock] = useState<number | "">(0);
  const [savingStock, setSavingStock] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (itemId) {
      fetch(`/api/items/${itemId}`).then(r => r.json()).then((data: ItemDetail) => {
        setItem(data);
        setEditQty(data.quantity);
        setEditMinStock(data.minStock ?? "");
      });
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

  const handleMarkEmpty = async () => {
    if (!item) return;
    if (!confirm("Mettre la quantité à 0 ?")) return;
    await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 0 }),
    });
    const updated = await fetch(`/api/items/${item.id}`).then(r => r.json());
    setItem(updated);
    setEditQty(0);
    onRefresh();
  };

  const handleStockSave = async () => {
    if (!item) return;
    setSavingStock(true);
    await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: editQty,
        minStock: editMinStock !== "" ? Number(editMinStock) : null,
      }),
    });
    const updated = await fetch(`/api/items/${item.id}`).then(r => r.json());
    setItem(updated);
    setEditQty(updated.quantity);
    setEditMinStock(updated.minStock ?? "");
    onRefresh();
    setSavingStock(false);
  };

  const stockChanged = item
    ? editQty !== item.quantity || (editMinStock !== "" ? Number(editMinStock) : null) !== item.minStock
    : false;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("La photo ne doit pas dépasser 2 Mo");
      return;
    }
    setSavingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: base64 }),
      });
      if (!uploadRes.ok) {
        alert("Erreur lors de l'upload de la photo");
        setSavingPhoto(false);
        return;
      }
      const { path } = await uploadRes.json();
      // Delete old photo file if it was a file path
      if (item.photo && item.photo.includes("/uploads/")) {
        await fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: item.photo }) });
      }
      await fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: path }),
      });
      const updated = await fetch(`/api/items/${item.id}`).then(r => r.json());
      setItem(updated);
      onRefresh();
      setSavingPhoto(false);
    };
    reader.readAsDataURL(file);
    if (photoRef.current) photoRef.current.value = "";
  };

  const handlePhotoDelete = async () => {
    if (!item || !confirm("Supprimer la photo ?")) return;
    setSavingPhoto(true);
    // Delete photo file if it was a file path
    if (item.photo && item.photo.includes("/uploads/")) {
      await fetch("/api/upload", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: item.photo }) });
    }
    await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: null }),
    });
    const updated = await fetch(`/api/items/${item.id}`).then(r => r.json());
    setItem(updated);
    onRefresh();
    setSavingPhoto(false);
  };

  if (!item) return null;

  return (
    <Modal isOpen={!!itemId} onClose={onClose} title={item.name} size="xl">
      <div className="space-y-6">
        {/* Header info */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="shrink-0 space-y-2">
            <ImageZoom src={item.photo || ""} alt={item.name} />
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={savingPhoto}
                className="text-xs text-garage-400 hover:text-accent transition-colors"
              >
                {savingPhoto ? "..." : item.photo ? "Changer" : "Ajouter photo"}
              </button>
              {item.photo && (
                <button
                  type="button"
                  onClick={handlePhotoDelete}
                  disabled={savingPhoto}
                  className="text-xs text-garage-400 hover:text-red-400 transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent">{item.reference}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-garage-600 text-garage-200">{item.category.name}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                item.status === "actif" ? "bg-green-900 text-green-300" :
                item.status === "vendu" ? "bg-red-900 text-red-300" :
                "bg-yellow-900 text-yellow-300"
              }`}>{item.status}</span>
            </div>
            <p className="text-garage-300 text-sm">{item.description || "Aucune description"}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div><span className="text-garage-400">Quantité:</span> {item.quantity} {item.unit}</div>
              <div><span className="text-garage-400">Emplacement:</span> {item.location ? `${item.location.lieu} - ${item.location.emplacement}-${item.location.ligne}${item.location.colonne}` : "Non assigné"}</div>
            </div>
          </div>
        </div>

        {/* Stock management (consommables) */}
        {item.reference === "Consommables" && (
          <div className="card space-y-3">
            <h3 className="font-semibold text-sm text-accent">Gestion du stock</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs text-garage-300 mb-1">Quantité</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditQty(Math.max(0, editQty - 1))}
                    className="w-8 h-8 rounded bg-garage-500 hover:bg-garage-400 text-garage-100 font-bold text-lg flex items-center justify-center transition-colors"
                  >-</button>
                  <input
                    type="number"
                    min={0}
                    value={editQty}
                    onChange={e => setEditQty(Math.max(0, Number(e.target.value)))}
                    className="input-field w-20 text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setEditQty(editQty + 1)}
                    className="w-8 h-8 rounded bg-garage-500 hover:bg-garage-400 text-garage-100 font-bold text-lg flex items-center justify-center transition-colors"
                  >+</button>
                  <span className="text-sm text-garage-300 ml-1">{item.unit}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-garage-300 mb-1">Stock mini</label>
                <input
                  type="number"
                  min={0}
                  value={editMinStock}
                  onChange={e => setEditMinStock(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="—"
                  className="input-field w-20 text-center text-sm"
                />
              </div>
              <button
                onClick={handleStockSave}
                disabled={savingStock || !stockChanged}
                className="btn-primary text-sm py-1.5 px-4"
              >
                {savingStock ? "..." : "Enregistrer"}
              </button>
            </div>
            {item.minStock !== null && (
              <p className={`text-xs font-medium ${item.quantity <= item.minStock ? "text-red-400" : "text-green-400"}`}>
                {item.quantity <= item.minStock
                  ? `Stock bas (${item.quantity}/${item.minStock} ${item.unit})`
                  : `Stock OK (${item.quantity}/${item.minStock} ${item.unit})`}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        {item.status === "actif" && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setLoanForm(!loanForm)} className="btn-primary text-sm">Prêter</button>
            {item.reference === "Materiels" && (
              <button onClick={() => handleStatusChange("vendu")} className="btn-danger text-sm">Marquer Vendu</button>
            )}
            {item.reference === "Consommables" && item.quantity > 0 && (
              <button onClick={handleMarkEmpty} className="btn-danger text-sm">Marquer Vide</button>
            )}
          </div>
        )}

        {/* Loan form */}
        {loanForm && (
          <form onSubmit={handleLoan} className="card space-y-3">
            <h3 className="font-semibold text-sm text-accent">Nouveau prêt</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-garage-700 rounded-lg px-3 py-2 text-sm">
                  <span>{loan.firstName} {loan.lastName} — retour prévu: {new Date(loan.expectedReturn).toLocaleDateString("fr-FR")}</span>
                  <button onClick={() => handleReturnLoan(loan.id)} className="btn-primary text-xs py-1 px-2 shrink-0">Rendu</button>
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
                <div key={h.id} className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm bg-garage-700/50 rounded px-3 py-1.5">
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
