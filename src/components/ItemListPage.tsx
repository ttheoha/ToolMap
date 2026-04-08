"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "./Modal";
import ItemForm from "./ItemForm";
import ItemDetailModal from "./ItemDetailModal";
import ImageZoom from "./ImageZoom";

interface Item {
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
  _count: { loans: number };
}

interface Category {
  id: number;
  name: string;
  reference: string;
  _count: { items: number };
}

interface Props {
  reference: string;
  title: string;
}

export default function ItemListPage({ reference, title }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ reference, status: "actif" });
    if (search) params.set("search", search);
    if (filterCat) params.set("categoryId", filterCat);
    fetch(`/api/items?${params}`).then(r => r.json()).then(setItems);
    fetch(`/api/categories?reference=${reference}`).then(r => r.json()).then(setCategories);
  }, [reference, search, filterCat]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet élément ?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-accent">{title}</h1>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-primary">
          + Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          placeholder="Rechercher (nom, catégorie, réf)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1 min-w-[250px]"
        />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="select-field">
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c._count.items})</option>)}
        </select>
      </div>

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="card text-center text-garage-400 py-12">Aucun élément trouvé</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="card hover:border-accent/50 transition-colors cursor-pointer group" onClick={() => setDetailId(item.id)}>
              <div className="flex gap-3">
                <ImageZoom src={item.photo || ""} alt={item.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate group-hover:text-accent transition-colors">{item.name}</h3>
                  <p className="text-xs text-garage-400">{item.category.name}</p>
                  <p className="text-xs text-garage-500 mt-1">{item.quantity} {item.unit}</p>
                  {item._count.loans > 0 && (
                    <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded mt-1 inline-block">Prêté</span>
                  )}
                </div>
              </div>
              {item.location && (
                <p className="text-xs text-garage-500 mt-2 border-t border-garage-700 pt-2">
                  {item.location.lieu} - {item.location.emplacement}-{item.location.ligne}{item.location.colonne}
                </p>
              )}
              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditItem(item); setShowForm(true); }} className="text-xs text-garage-400 hover:text-accent">Modifier</button>
                <span className="text-garage-600">|</span>
                <button onClick={() => handleDelete(item.id)} className="text-xs text-garage-400 hover:text-red-400">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? "Modifier" : "Ajouter"} size="lg">
        <ItemForm
          reference={reference}
          initial={editItem ? {
            id: editItem.id,
            name: editItem.name,
            description: editItem.description || "",
            quantity: editItem.quantity,
            unit: editItem.unit,
            categoryId: editItem.category.id,
            locationId: editItem.location?.id,
            photo: editItem.photo,
          } : undefined}
          onSave={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <ItemDetailModal itemId={detailId} onClose={() => setDetailId(null)} onRefresh={load} />
    </div>
  );
}
