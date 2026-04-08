"use client";

import { useState, useRef } from "react";

export default function BackupRestore() {
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    window.open("/api/backup", "_blank");
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Attention : la restauration remplacera TOUTES les données actuelles. Continuer ?")) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setRestoring(true);
    setMessage(null);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backup),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Restauration terminée avec succès. Rechargez la page." });
      } else {
        setMessage({ type: "error", text: data.error || "Erreur lors de la restauration" });
      }
    } catch {
      setMessage({ type: "error", text: "Fichier invalide ou erreur de lecture" });
    }

    setRestoring(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-garage-200">Sauvegarde & Restauration</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h3 className="font-medium text-accent">Sauvegarder</h3>
          <p className="text-sm text-garage-400">
            Exporte l'intégralité de la base de données (items, catégories, emplacements, historique, prêts) dans un fichier JSON.
          </p>
          <button onClick={handleBackup} className="btn-primary">
            Télécharger la sauvegarde
          </button>
        </div>

        <div className="card space-y-3">
          <h3 className="font-medium text-accent">Restaurer</h3>
          <p className="text-sm text-garage-400">
            Importe un fichier de sauvegarde JSON. Toutes les données actuelles seront remplacées.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={restoring}
              className="btn-danger"
            >
              {restoring ? "Restauration..." : "Restaurer depuis un fichier"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestore}
            />
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.type === "success"
            ? "bg-green-900/50 text-green-300 border border-green-700"
            : "bg-red-900/50 text-red-300 border border-red-700"
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
