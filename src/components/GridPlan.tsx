"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Modal from "./Modal";
import ItemForm from "./ItemForm";
import ImageZoom from "./ImageZoom";

interface LieuType {
  id: number;
  name: string;
}

interface GridConfig {
  id: number;
  lieu: string;
  emplacement: string;
  rows: number;
  cols: number;
}

interface LocationData {
  id: number;
  lieu: string;
  emplacement: string;
  ligne: string;
  colonne: number;
  _count: { items: number };
}

interface ItemInLocation {
  id: number;
  name: string;
  photo: string | null;
  quantity: number;
  unit: string;
  category: { name: string };
}

export default function GridPlan() {
  const [lieuxList, setLieuxList] = useState<LieuType[]>([]);
  const [lieu, setLieu] = useState("");
  const [emplacement, setEmplacement] = useState("E0");
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [grids, setGrids] = useState<GridConfig[]>([]);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [generating, setGenerating] = useState(false);

  // Cell modal state
  const [selectedCell, setSelectedCell] = useState<{ lieu: string; emplacement: string; ligne: string; colonne: number } | null>(null);
  const [cellItems, setCellItems] = useState<ItemInLocation[]>([]);
  const [cellLocationId, setCellLocationId] = useState<number | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAssignExisting, setShowAssignExisting] = useState(false);
  const [unassignedItems, setUnassignedItems] = useState<ItemInLocation[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [addItemReference, setAddItemReference] = useState("Outils");

  // Search item on grid
  const [gridSearch, setGridSearch] = useState("");
  const [highlightedLocationId, setHighlightedLocationId] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<{ id: number; name: string; locationId: number; emplacement: string; ligne: string; colonne: number }[]>([]);

  // Load lieux list
  useEffect(() => {
    fetch("/api/lieux").then(r => r.json()).then((data: LieuType[]) => {
      setLieuxList(data);
      if (data.length > 0 && !lieu) setLieu(data[0].name);
    });
  }, [lieu]);

  const loadGrids = useCallback(() => {
    if (!lieu) return;
    fetch(`/api/grid?lieu=${lieu}`).then(r => r.json()).then(setGrids);
    fetch(`/api/locations?lieu=${lieu}`).then(r => r.json()).then(setLocations);
  }, [lieu]);

  useEffect(() => { loadGrids(); }, [loadGrids]);

  const handleGridSearch = async (query: string) => {
    setGridSearch(query);
    setHighlightedLocationId(null);
    if (!query.trim() || !lieu) {
      setSearchResults([]);
      return;
    }
    const items = await fetch(`/api/items?search=${encodeURIComponent(query)}&status=actif`).then(r => r.json());
    const results = items
      .filter((i: { location: { lieu: string; emplacement: string; ligne: string; colonne: number } | null }) => i.location && i.location.lieu === lieu)
      .map((i: { id: number; name: string; locationId: number; location: { emplacement: string; ligne: string; colonne: number } }) => ({
        id: i.id,
        name: i.name,
        locationId: i.locationId,
        emplacement: i.location.emplacement,
        ligne: i.location.ligne,
        colonne: i.location.colonne,
      }));
    setSearchResults(results);
  };

  const handleSelectSearchResult = (result: typeof searchResults[0]) => {
    setEmplacement(result.emplacement);
    setHighlightedLocationId(result.locationId);
  };

  // When a grid config exists for this emplacement, load it
  useEffect(() => {
    const existing = grids.find(g => g.emplacement === emplacement);
    if (existing) {
      setRows(existing.rows);
      setCols(existing.cols);
    }
  }, [grids, emplacement]);

  // Generate grid data
  const gridCells = useMemo(() => {
    const existing = grids.find(g => g.emplacement === emplacement);
    if (!existing) return null;

    const cells: { ligne: string; colonne: number; hasItems: boolean; locationId: number | null }[][] = [];
    for (let r = 0; r < existing.rows; r++) {
      const row: typeof cells[0] = [];
      const ligne = String.fromCharCode(65 + r);
      for (let c = 1; c <= existing.cols; c++) {
        const loc = locations.find(l => l.emplacement === emplacement && l.ligne === ligne && l.colonne === c);
        row.push({
          ligne,
          colonne: c,
          hasItems: loc ? loc._count.items > 0 : false,
          locationId: loc?.id || null,
        });
      }
      cells.push(row);
    }
    return cells;
  }, [grids, locations, emplacement]);

  const handleGenerate = async () => {
    setGenerating(true);
    await fetch("/api/grid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lieu, emplacement, rows, cols }),
    });
    loadGrids();
    setGenerating(false);
  };

  const handleCellClick = async (ligne: string, colonne: number, locationId: number | null) => {
    setSelectedCell({ lieu, emplacement, ligne, colonne });
    setCellLocationId(locationId);
    if (locationId) {
      const items = await fetch(`/api/items?locationId=${locationId}&status=actif`).then(r => r.json());
      setCellItems(items);
    } else {
      setCellItems([]);
    }
  };

  const loadUnassignedItems = async (search?: string) => {
    const params = new URLSearchParams({ locationId: "none", status: "actif" });
    if (search) params.set("search", search);
    const items = await fetch(`/api/items?${params}`).then(r => r.json());
    setUnassignedItems(items);
  };

  const handleAssignItem = async (itemId: number) => {
    if (!cellLocationId) return;
    setAssigningId(itemId);
    await fetch(`/api/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId: cellLocationId }),
    });
    setAssigningId(null);
    setShowAssignExisting(false);
    setAssignSearch("");
    if (selectedCell) {
      handleCellClick(selectedCell.ligne, selectedCell.colonne, cellLocationId);
    }
    loadGrids();
  };

  const closeCell = () => {
    setSelectedCell(null);
    setCellItems([]);
    setCellLocationId(null);
    setShowAddItem(false);
    setShowAssignExisting(false);
    setAssignSearch("");
  };

  const [editingGrid, setEditingGrid] = useState<GridConfig | null>(null);
  const [editRows, setEditRows] = useState(5);
  const [editCols, setEditCols] = useState(5);

  const handleEditGrid = (grid: GridConfig) => {
    setEditingGrid(grid);
    setEditRows(grid.rows);
    setEditCols(grid.cols);
  };

  const handleSaveEdit = async () => {
    if (!editingGrid) return;
    setGenerating(true);
    await fetch(`/api/grid/${editingGrid.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: editRows, cols: editCols }),
    });
    setEditingGrid(null);
    loadGrids();
    setGenerating(false);
  };

  const handleDeleteGrid = async (grid: GridConfig) => {
    if (!confirm(`Supprimer le plan "${grid.lieu} - ${grid.emplacement}" et tous ses casiers vides ?`)) return;
    const res = await fetch(`/api/grid/${grid.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Erreur lors de la suppression");
      return;
    }
    if (emplacement === grid.emplacement) {
      setEmplacement("E0");
    }
    loadGrids();
  };

  // Available emplacements from existing grids
  const existingEmplacements = grids.map(g => g.emplacement);
  const currentGrid = grids.find(g => g.emplacement === emplacement);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm text-garage-300 mb-1">Lieu</label>
            <select value={lieu} onChange={e => setLieu(e.target.value)} className="select-field w-full">
              {lieuxList.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-garage-300 mb-1">Emplacement</label>
            <input
              value={emplacement}
              onChange={e => setEmplacement(e.target.value)}
              className="input-field w-full"
              placeholder="E0, E1, E11..."
            />
          </div>
          <div>
            <label className="block text-sm text-garage-300 mb-1">Lignes (A-Z)</label>
            <input type="number" min={1} max={26} value={rows} onChange={e => setRows(Number(e.target.value))} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm text-garage-300 mb-1">Colonnes (1-N)</label>
            <input type="number" min={1} max={50} value={cols} onChange={e => setCols(Number(e.target.value))} className="input-field w-full" />
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary h-10 col-span-2 sm:col-span-1">
            {generating ? "..." : "Générer le plan"}
          </button>
        </div>
      </div>

      {/* Emplacement tabs */}
      {existingEmplacements.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {existingEmplacements.map(emp => (
            <button
              key={emp}
              onClick={() => setEmplacement(emp)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                emplacement === emp ? "bg-accent text-white" : "bg-garage-700 text-garage-300 hover:bg-garage-600"
              }`}
            >
              {emp}
            </button>
          ))}
        </div>
      )}

      {/* Search item on grid */}
      {existingEmplacements.length > 0 && (
        <div className="card">
          <div className="relative">
            <input
              value={gridSearch}
              onChange={e => handleGridSearch(e.target.value)}
              placeholder="Rechercher un élément sur le plan..."
              className="input-field w-full"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-garage-800 border border-garage-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { handleSelectSearchResult(r); setGridSearch(""); setSearchResults([]); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-garage-700 transition-colors flex justify-between items-center ${
                      r.locationId === highlightedLocationId ? "bg-accent/20" : ""
                    }`}
                  >
                    <span className="text-garage-100 truncate">{r.name}</span>
                    <span className="text-garage-400 text-xs shrink-0 ml-2">{r.emplacement}-{r.ligne}{r.colonne}</span>
                  </button>
                ))}
              </div>
            )}
            {gridSearch && searchResults.length === 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-garage-800 border border-garage-600 rounded-lg shadow-xl px-3 py-3 text-sm text-garage-500 text-center">
                Aucun élément trouvé dans ce lieu
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid display */}
      {gridCells ? (
        <div className="card overflow-x-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-semibold text-garage-300">
              {lieu.replace("_", " ")} — {emplacement} ({gridCells.length} lignes × {gridCells[0]?.length || 0} colonnes)
            </h3>
            {currentGrid && (
              <div className="flex gap-2">
                <button onClick={() => handleEditGrid(currentGrid)} className="btn-secondary text-sm">
                  Modifier
                </button>
                <button onClick={() => handleDeleteGrid(currentGrid)} className="btn-danger text-sm">
                  Supprimer
                </button>
              </div>
            )}
          </div>
          <div className="inline-block">
            {/* Column headers */}
            <div className="flex">
              <div className="w-10 h-10 flex items-center justify-center text-xs text-garage-100 font-bold shrink-0" />
              {gridCells[0]?.map((_, ci) => (
                <div key={ci} className="w-20 h-10 flex items-center justify-center text-xs text-garage-100 font-bold shrink-0">
                  {ci + 1}
                </div>
              ))}
            </div>

            {/* Rows */}
            {gridCells.map((row, ri) => (
              <div key={ri} className="flex">
                <div className="w-10 h-20 flex items-center justify-center text-xs text-garage-100 font-bold shrink-0">
                  {String.fromCharCode(65 + ri)}
                </div>
                {row.map((cell, ci) => {
                  const isHighlighted = highlightedLocationId !== null && cell.locationId === highlightedLocationId;
                  return (
                    <button
                      key={ci}
                      onClick={() => handleCellClick(cell.ligne, cell.colonne, cell.locationId)}
                      className={`w-20 h-20 m-0.5 rounded-lg flex flex-col items-center justify-center text-xs transition-all hover:scale-105 shrink-0 ${
                        isHighlighted
                          ? "bg-accent/30 border-2 border-accent text-accent ring-2 ring-accent/50 scale-110"
                          : cell.hasItems
                            ? "bg-blue-900/60 border-2 border-blue-500 text-blue-100 hover:bg-blue-800/60"
                            : "bg-garage-600/40 border-2 border-dashed border-garage-400 text-garage-200 hover:border-garage-300"
                      }`}
                    >
                      <span className="font-mono font-semibold">{emplacement}-{cell.ligne}{cell.colonne}</span>
                      {cell.hasItems && <span className="text-[10px] mt-0.5 text-blue-300">occupé</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center text-garage-500 py-12">
          Sélectionnez un lieu et un emplacement, puis générez le plan.
        </div>
      )}

      {/* Cell detail modal */}
      <Modal
        isOpen={!!selectedCell}
        onClose={closeCell}
        title={selectedCell ? `${selectedCell.lieu.replace("_", " ")} — ${selectedCell.emplacement}-${selectedCell.ligne}${selectedCell.colonne}` : ""}
        size="lg"
      >
        {selectedCell && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm text-garage-400">
                Contenu du casier {selectedCell.emplacement}-{selectedCell.ligne}{selectedCell.colonne}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => { setShowAssignExisting(true); setShowAddItem(false); loadUnassignedItems(); }} className="btn-secondary text-sm">
                  + Élément existant
                </button>
                <button onClick={() => { setShowAddItem(true); setShowAssignExisting(false); }} className="btn-primary text-sm">
                  + Nouvel élément
                </button>
              </div>
            </div>

            {cellItems.length === 0 ? (
              <p className="text-garage-500 text-center py-6">Casier vide</p>
            ) : (
              <div className="space-y-2">
                {cellItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-garage-700 rounded-lg px-3 py-2">
                    <ImageZoom src={item.photo || ""} alt={item.name} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-garage-400">{item.category.name} — {item.quantity} {item.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAssignExisting && cellLocationId && (
              <div className="border-t border-garage-700 pt-4">
                <h3 className="text-sm font-semibold text-accent mb-3">Ajouter un élément existant</h3>
                <input
                  value={assignSearch}
                  onChange={e => { setAssignSearch(e.target.value); loadUnassignedItems(e.target.value); }}
                  placeholder="Rechercher un élément sans casier..."
                  className="input-field w-full mb-3"
                />
                {unassignedItems.length === 0 ? (
                  <p className="text-garage-500 text-center py-4 text-sm">Aucun élément sans casier trouvé</p>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {unassignedItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 bg-garage-700 rounded-lg px-3 py-2">
                        {item.photo && <img src={item.photo} alt={item.name} className="w-8 h-8 object-cover rounded" />}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-garage-400">{item.category.name} — {item.quantity} {item.unit}</p>
                        </div>
                        <button
                          onClick={() => handleAssignItem(item.id)}
                          disabled={assigningId === item.id}
                          className="btn-primary text-xs px-2 py-1 shrink-0"
                        >
                          {assigningId === item.id ? "..." : "Assigner"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end pt-3">
                  <button onClick={() => { setShowAssignExisting(false); setAssignSearch(""); }} className="btn-secondary text-sm">Annuler</button>
                </div>
              </div>
            )}

            {showAddItem && cellLocationId && (
              <div className="border-t border-garage-700 pt-4">
                <h3 className="text-sm font-semibold text-accent mb-3">Ajouter un élément</h3>
                <div className="mb-3">
                  <label className="block text-sm text-garage-300 mb-1">Type</label>
                  <select value={addItemReference} onChange={e => setAddItemReference(e.target.value)} className="select-field w-full">
                    <option value="Outils">Outils</option>
                    <option value="Materiels">Matériels</option>
                    <option value="Consommables">Consommables</option>
                  </select>
                </div>
                <ItemForm
                  key={addItemReference}
                  reference={addItemReference}
                  presetLocationId={cellLocationId}
                  onSave={() => {
                    setShowAddItem(false);
                    handleCellClick(selectedCell.ligne, selectedCell.colonne, cellLocationId);
                    loadGrids();
                  }}
                  onCancel={() => setShowAddItem(false)}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit grid modal */}
      <Modal
        isOpen={!!editingGrid}
        onClose={() => setEditingGrid(null)}
        title={editingGrid ? `Modifier ${editingGrid.lieu.replace("_", " ")} — ${editingGrid.emplacement}` : ""}
      >
        {editingGrid && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-garage-300 mb-1">Lieu</label>
              <input value={editingGrid.lieu.replace("_", " ")} disabled className="input-field w-full opacity-50" />
            </div>
            <div>
              <label className="block text-sm text-garage-300 mb-1">Emplacement</label>
              <input value={editingGrid.emplacement} disabled className="input-field w-full opacity-50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-garage-300 mb-1">Lignes (A-Z)</label>
                <input type="number" min={1} max={26} value={editRows} onChange={e => setEditRows(Number(e.target.value))} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm text-garage-300 mb-1">Colonnes (1-N)</label>
                <input type="number" min={1} max={50} value={editCols} onChange={e => setEditCols(Number(e.target.value))} className="input-field w-full" />
              </div>
            </div>
            <p className="text-xs text-garage-500">
              Les casiers hors de la nouvelle grille seront supprimés uniquement s'ils sont vides.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditingGrid(null)} className="btn-secondary">Annuler</button>
              <button onClick={handleSaveEdit} disabled={generating} className="btn-primary">
                {generating ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
