"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "./Modal";
import ItemForm from "./ItemForm";
import ItemDetailModal from "./ItemDetailModal";
import ImageZoom from "./ImageZoom";
import { useDebounce } from "@/hooks/useDebounce";

interface Item {
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
  _count: { loans: number };
}

interface Category {
  id: number;
  name: string;
  reference: string;
  _count: { items: number };
}

interface LocationOption {
  id: number;
  lieu: string;
  emplacement: string;
  ligne: string;
  colonne: number;
}

interface Props {
  reference: string;
  title: string;
}

const ITEMS_PER_PAGE = 24;

export default function ItemListPage({ reference, title }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Multi-select
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showBatchAction, setShowBatchAction] = useState(false);
  const [batchAction, setBatchAction] = useState<"delete" | "move" | "category">("delete");
  const [batchCategoryId, setBatchCategoryId] = useState<number | "">("");
  const [batchLocationId, setBatchLocationId] = useState<number | "" | "none">("");
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(() => {
    const params = new URLSearchParams({ reference, status: "actif", page: String(page), limit: String(ITEMS_PER_PAGE) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filterCat) params.set("categoryId", filterCat);
    fetch(`/api/items?${params}`).then(r => r.json()).then(data => {
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    });
    fetch(`/api/categories?reference=${reference}`).then(r => r.json()).then(setCategories);
  }, [reference, debouncedSearch, filterCat, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filterCat]);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet élément ?")) return;
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    load();
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map(i => i.id)));
    }
  };

  const openBatchAction = () => {
    setShowBatchAction(true);
    fetch("/api/locations").then(r => r.json()).then(setLocations);
  };

  const executeBatch = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    if (batchAction === "delete" && !confirm(`Supprimer ${ids.length} élément(s) ?`)) return;

    setBatchLoading(true);
    const body: Record<string, unknown> = { action: batchAction, ids };
    if (batchAction === "category") body.categoryId = Number(batchCategoryId);
    if (batchAction === "move") body.locationId = batchLocationId === "none" ? null : Number(batchLocationId);

    await fetch("/api/items/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setBatchLoading(false);
    setShowBatchAction(false);
    setSelected(new Set());
    load();
  };

  const selectionMode = selected.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-accent">{title}</h1>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-primary text-sm md:text-base shrink-0">
          + Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          placeholder="Rechercher (nom, catégorie, réf)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1 min-w-0"
        />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="select-field">
          <option value="">Toutes catégories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c._count.items})</option>)}
        </select>
      </div>

      {/* Batch selection bar */}
      {items.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={toggleSelectAll} className="text-xs text-garage-400 hover:text-accent transition-colors">
            {selected.size === items.length ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
          {selectionMode && (
            <>
              <span className="text-xs text-accent font-medium">{selected.size} sélectionné(s)</span>
              <button onClick={openBatchAction} className="btn-secondary text-xs">Actions groupées</button>
              <button onClick={() => setSelected(new Set())} className="text-xs text-garage-500 hover:text-garage-300">Annuler</button>
            </>
          )}
        </div>
      )}

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="card text-center text-garage-400 py-12">Aucun élément trouvé</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className={`card transition-colors cursor-pointer group ${
                selected.has(item.id) ? "border-accent ring-1 ring-accent/50" : "hover:border-accent/50"
              }`}
              onClick={() => selectionMode ? toggleSelect(item.id) : setDetailId(item.id)}
            >
              <div className="flex gap-3">
                {selectionMode && (
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    onClick={e => e.stopPropagation()}
                    className="mt-1 shrink-0 accent-orange-500"
                  />
                )}
                <ImageZoom src={item.photo || ""} alt={item.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate group-hover:text-accent transition-colors text-garage-100">{item.name}</h3>
                  <p className="text-xs text-garage-200">{item.category.name}</p>
                  <p className="text-xs text-garage-300 mt-1">{item.quantity} {item.unit}</p>
                  {item._count.loans > 0 && (
                    <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded mt-1 inline-block">Prêté</span>
                  )}
                  {item.quantity === 0 && item.reference === "Consommables" && (
                    <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded mt-1 inline-block">Vide</span>
                  )}
                </div>
              </div>
              {item.location && (
                <p className="text-xs text-garage-300 mt-2 border-t border-garage-700 pt-2">
                  {item.location.lieu} - {item.location.emplacement}-{item.location.ligne}{item.location.colonne}
                </p>
              )}
              {!selectionMode && (
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditItem(item); setShowForm(true); }} className="text-xs text-garage-400 hover:text-accent">Modifier</button>
                  <span className="text-garage-600">|</span>
                  <button onClick={() => handleDelete(item.id)} className="text-xs text-garage-400 hover:text-red-400">Supprimer</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-40">Précédent</button>
          <span className="text-sm text-garage-300">Page {page}/{totalPages} ({totalItems} éléments)</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm disabled:opacity-40">Suivant</button>
        </div>
      )}

      {/* Batch action modal */}
      <Modal isOpen={showBatchAction} onClose={() => setShowBatchAction(false)} title={`Actions groupées (${selected.size} éléments)`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-garage-300 mb-1">Action</label>
            <select value={batchAction} onChange={e => setBatchAction(e.target.value as typeof batchAction)} className="select-field w-full">
              <option value="delete">Supprimer</option>
              <option value="move">Déplacer (casier)</option>
              <option value="category">Changer de catégorie</option>
            </select>
          </div>

          {batchAction === "category" && (
            <div>
              <label className="block text-sm text-garage-300 mb-1">Nouvelle catégorie</label>
              <select value={batchCategoryId} onChange={e => setBatchCategoryId(Number(e.target.value))} className="select-field w-full">
                <option value="">Sélectionner...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {batchAction === "move" && (
            <div>
              <label className="block text-sm text-garage-300 mb-1">Nouvel emplacement</label>
              <select value={batchLocationId} onChange={e => setBatchLocationId(e.target.value === "none" ? "none" : Number(e.target.value))} className="select-field w-full">
                <option value="">Sélectionner...</option>
                <option value="none">Retirer du casier</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.lieu} - {l.emplacement}-{l.ligne}{l.colonne}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowBatchAction(false)} className="btn-secondary">Annuler</button>
            <button
              onClick={executeBatch}
              disabled={batchLoading || (batchAction === "category" && !batchCategoryId) || (batchAction === "move" && batchLocationId === "")}
              className={batchAction === "delete" ? "btn-danger" : "btn-primary"}
            >
              {batchLoading ? "..." : batchAction === "delete" ? "Supprimer" : "Appliquer"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? "Modifier" : "Ajouter"} size="lg">
        <ItemForm
          reference={reference}
          initial={editItem ? {
            id: editItem.id,
            name: editItem.name,
            description: editItem.description || "",
            quantity: editItem.quantity,
            minStock: editItem.minStock,
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
