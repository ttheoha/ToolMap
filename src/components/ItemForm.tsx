"use client";

import { useState, useEffect, useRef } from "react";

interface Category {
  id: number;
  name: string;
  reference: string;
}

interface Location {
  id: number;
  lieu: string;
  emplacement: string;
  ligne: string;
  colonne: number;
}

interface ItemFormProps {
  reference: string;
  onSave: () => void;
  onCancel: () => void;
  initial?: {
    id?: number;
    name?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    categoryId?: number;
    locationId?: number;
    photo?: string | null;
  };
  presetLocationId?: number;
}

export default function ItemForm({ reference, onSave, onCancel, initial, presetLocationId }: ItemFormProps) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [quantity, setQuantity] = useState(initial?.quantity || 1);
  const [unit, setUnit] = useState(initial?.unit || "unitaire");
  const [categoryId, setCategoryId] = useState<number | "">(initial?.categoryId || "");
  const [locationId, setLocationId] = useState<number | "">(presetLocationId || initial?.locationId || "");
  const [photo, setPhoto] = useState<string | null>(initial?.photo || null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/categories?reference=${reference}`).then(r => r.json()).then(setCategories);
    fetch("/api/locations").then(r => r.json()).then(setLocations);
  }, [reference]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) return;
    setSaving(true);

    const body = {
      name,
      reference,
      description,
      quantity,
      unit,
      categoryId: Number(categoryId),
      locationId: locationId ? Number(locationId) : null,
      photo,
    };

    const url = initial?.id ? `/api/items/${initial.id}` : "/api/items";
    const method = initial?.id ? "PUT" : "POST";

    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-garage-300 mb-1">Nom *</label>
        <input value={name} onChange={e => setName(e.target.value)} className="input-field w-full" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-garage-300 mb-1">Catégorie *</label>
          <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} className="select-field w-full" required>
            <option value="">Sélectionner...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-garage-300 mb-1">Emplacement</label>
          <select value={locationId} onChange={e => setLocationId(e.target.value ? Number(e.target.value) : "")} className="select-field w-full">
            <option value="">Aucun</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.lieu} - {l.emplacement}-{l.ligne}{l.colonne}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-garage-300 mb-1">Quantité</label>
          <input type="number" min={0} value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="input-field w-full" />
        </div>
        <div>
          <label className="block text-sm text-garage-300 mb-1">Unité</label>
          <select value={unit} onChange={e => setUnit(e.target.value)} className="select-field w-full">
            <option value="unitaire">Unitaire</option>
            <option value="litre">Litre</option>
            <option value="metre">Mètre</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-garage-300 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field w-full" rows={3} />
      </div>
      <div>
        <label className="block text-sm text-garage-300 mb-1">Photo</label>
        <div className="flex items-center gap-3">
          {photo && <img src={photo} alt="preview" className="w-16 h-16 object-cover rounded border border-garage-600" />}
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-sm">
            {photo ? "Changer" : "Ajouter une photo"}
          </button>
          {photo && <button type="button" onClick={() => setPhoto(null)} className="text-red-400 text-sm hover:text-red-300">Supprimer</button>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? "..." : initial?.id ? "Modifier" : "Créer"}</button>
      </div>
    </form>
  );
}
