"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import ImageZoom from "@/components/ImageZoom";
import Link from "next/link";

interface LocatedItem {
  id: number;
  name: string;
  reference: string;
  photo: string | null;
  quantity: number;
  unit: string;
  category: { name: string };
  location: {
    id: number;
    lieu: string;
    emplacement: string;
    ligne: string;
    colonne: number;
  } | null;
}

function LocaliserContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(search, 300);
  const [results, setResults] = useState<LocatedItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/items?search=${encodeURIComponent(debouncedSearch)}&status=actif`)
      .then(r => r.json())
      .then((items: LocatedItem[]) => {
        setResults(items);
        setLoading(false);
      });
  }, [debouncedSearch]);

  return (
    <>
      <div className="card">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tapez le nom d'un outil, matériel ou consommable..."
          className="input-field w-full text-lg"
          autoFocus
        />
      </div>

      {loading && <p className="text-garage-400 text-center py-4">Recherche...</p>}

      {!loading && debouncedSearch && results.length === 0 && (
        <div className="card text-center text-garage-500 py-12">Aucun résultat</div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(item => (
            <div key={item.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <ImageZoom src={item.photo || ""} alt={item.name} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-garage-100 truncate">{item.name}</h3>
                  <p className="text-xs text-garage-400">{item.category.name} — {item.reference} — {item.quantity} {item.unit}</p>
                </div>
              </div>

              {item.location ? (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-garage-200">{item.location.lieu.replace("_", " ")}</p>
                    <p className="text-lg font-bold text-accent">
                      {item.location.emplacement}-{item.location.ligne}{item.location.colonne}
                    </p>
                  </div>
                  <Link
                    href={`/parametrage?lieu=${encodeURIComponent(item.location.lieu)}&emplacement=${item.location.emplacement}&ligne=${item.location.ligne}&colonne=${item.location.colonne}`}
                    className="btn-primary text-xs py-1.5 px-3 shrink-0"
                  >
                    Voir sur le plan
                  </Link>
                </div>
              ) : (
                <span className="text-sm text-garage-500 shrink-0">Aucun casier assigné</span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function LocaliserPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-accent">Localiser un outil</h1>
      <Suspense fallback={<div className="text-garage-400 text-center py-8">Chargement...</div>}>
        <LocaliserContent />
      </Suspense>
    </div>
  );
}
