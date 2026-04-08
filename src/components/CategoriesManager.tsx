"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "./Modal";

interface Category {
  id: number;
  name: string;
  reference: string;
  _count: { items: number };
}

const REFERENCES = ["Outils", "Materiels", "Consommables"];

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterRef, setFilterRef] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [reference, setReference] = useState("Outils");

  const load = useCallback(() => {
    const params = filterRef ? `?reference=${filterRef}` : "";
    fetch(`/api/categories${params}`).then(r => r.json()).then(setCategories);
  }, [filterRef]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditCat(null);
    setName("");
    setReference("Outils");
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setName(cat.name);
    setReference(cat.reference);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editCat) {
      await fetch(`/api/categories/${editCat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, reference }),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, reference }),
      });
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <select value={filterRef} onChange={e => setFilterRef(e.target.value)} className="select-field">
            <option value="">Toutes références</option>
            {REFERENCES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Catégorie</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map(cat => (
          <div key={cat.id} className="card flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{cat.name}</h3>
              <p className="text-xs text-garage-400">{cat.reference} — {cat._count.items} items</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(cat)} className="text-xs text-garage-400 hover:text-accent">Modifier</button>
              <button onClick={() => handleDelete(cat.id)} className="text-xs text-garage-400 hover:text-red-400">Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editCat ? "Modifier la catégorie" : "Nouvelle catégorie"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-garage-300 mb-1">Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field w-full" required />
          </div>
          <div>
            <label className="block text-sm text-garage-300 mb-1">Référence</label>
            <select value={reference} onChange={e => setReference(e.target.value)} className="select-field w-full">
              {REFERENCES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">{editCat ? "Modifier" : "Créer"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
