"use client";

import { useState, useRef } from "react";

export default function ImportCSV() {
  const [reference, setReference] = useState("Outils");
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    // Detect separator
    const sep = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

    return lines.slice(1).map(line => {
      const values = line.split(sep).map(v => v.trim().replace(/^["']|["']$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      return row;
    }).filter(row => row.name || row.nom);
  };

  const normalizeRows = (rows: Record<string, string>[]): Record<string, string>[] => {
    return rows.map(row => ({
      name: row.name || row.nom || "",
      category: row.category || row.categorie || row.catégorie || "",
      description: row.description || "",
      quantity: row.quantity || row.quantite || row.quantité || "1",
      unit: row.unit || row.unite || row.unité || "unitaire",
    }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rows = normalizeRows(parseCSV(reader.result as string));
      setPreview(rows);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    setResult(null);
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview, reference }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
  };

  const handleReset = () => {
    setPreview(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold text-accent">Import CSV</h3>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-sm text-garage-300 mb-1">Type</label>
          <select value={reference} onChange={e => setReference(e.target.value)} className="select-field">
            <option value="Outils">Outils</option>
            <option value="Materiels">Matériels</option>
            <option value="Consommables">Consommables</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-garage-300 mb-1">Fichier CSV</label>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="input-field text-sm" />
        </div>
        <button
          onClick={() => {
            const bom = "\uFEFF";
            const csv = bom + "nom;catégorie;description;quantité;unité\nClé à molette;Clés;Clé ajustable 250mm;2;unitaire\nHuile moteur 5W30;Lubrifiants;Bidon 5L;3;litre\n";
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "import_exemple.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="btn-secondary text-sm h-10"
        >
          Exemple CSV
        </button>
      </div>

      <p className="text-xs text-garage-500">
        Colonnes attendues : <strong>name</strong> (ou nom), <strong>category</strong> (ou catégorie), description, quantity (ou quantité), unit (ou unité).
        Séparateur : virgule ou point-virgule.
      </p>

      {preview && preview.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm text-garage-300">Aperçu ({preview.length} lignes)</h4>
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-garage-700 text-garage-200">
                  <th className="text-left py-1 px-2">Nom</th>
                  <th className="text-left py-1 px-2">Catégorie</th>
                  <th className="text-left py-1 px-2">Description</th>
                  <th className="text-right py-1 px-2">Qté</th>
                  <th className="text-left py-1 px-2">Unité</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-garage-700/50">
                    <td className="py-1 px-2 text-garage-100">{row.name}</td>
                    <td className="py-1 px-2 text-garage-300">{row.category}</td>
                    <td className="py-1 px-2 text-garage-400 truncate max-w-32">{row.description}</td>
                    <td className="py-1 px-2 text-right text-garage-300">{row.quantity}</td>
                    <td className="py-1 px-2 text-garage-300">{row.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && <p className="text-xs text-garage-500 mt-1">... et {preview.length - 10} autres</p>}
          </div>

          <div className="flex gap-2">
            <button onClick={handleImport} disabled={importing} className="btn-primary text-sm">
              {importing ? "Import en cours..." : `Importer ${preview.length} éléments`}
            </button>
            <button onClick={handleReset} className="btn-secondary text-sm">Annuler</button>
          </div>
        </div>
      )}

      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm ${result.imported > 0 ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}>
          <p>{result.imported} importé(s), {result.skipped} ignoré(s)</p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-xs space-y-0.5">
              {result.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
