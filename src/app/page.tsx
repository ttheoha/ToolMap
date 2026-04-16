"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface LowStockItem {
  id: number;
  name: string;
  quantity: number;
  minStock: number;
  unit: string;
  category: string;
  location: string | null;
}

interface DashboardData {
  topOutils: { name: string; value: number }[];
  topConsommables: { name: string; value: number }[];
  activeLoans: {
    id: number;
    firstName: string;
    lastName: string;
    loanDate: string;
    expectedReturn: string;
    status: string;
    item: { id: number; name: string; reference: string };
  }[];
  lowStockConsommables: LowStockItem[];
  stats: {
    totalItems: number;
    totalOutils: number;
    totalMateriels: number;
    totalConsommables: number;
  };
}

const COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f43f5e",
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-center text-garage-400 py-20">Chargement...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl md:text-2xl font-bold text-accent">Tableau de bord</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total items", value: data.stats.totalItems, color: "text-accent" },
          { label: "Outils", value: data.stats.totalOutils, color: "text-blue-400" },
          { label: "Matériels", value: data.stats.totalMateriels, color: "text-green-400" },
          { label: "Consommables", value: data.stats.totalConsommables, color: "text-yellow-400" },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-garage-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Low stock consumables alert */}
      {data.lowStockConsommables.length > 0 && (
        <div className="card border-red-700/50">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-400 text-lg">&#9888;</span>
            <h2 className="text-lg font-semibold text-red-400">Consommables en stock bas</h2>
            <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full font-medium">
              {data.lowStockConsommables.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-garage-700 text-garage-200">
                  <th className="text-left py-2 px-3">Nom</th>
                  <th className="text-left py-2 px-3">Catégorie</th>
                  <th className="text-right py-2 px-3">Quantité</th>
                  <th className="text-right py-2 px-3">Stock mini</th>
                  <th className="text-left py-2 px-3">Emplacement</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockConsommables.map(item => (
                  <tr key={item.id} className="border-b border-garage-700/50 hover:bg-garage-700/30">
                    <td className="py-2 px-3 font-medium text-garage-100">{item.name}</td>
                    <td className="py-2 px-3 text-garage-200">{item.category}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${item.quantity === 0 ? "text-red-400" : "text-yellow-400"}`}>
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right text-garage-200">{item.minStock} {item.unit}</td>
                    <td className="py-2 px-3 text-garage-200">{item.location || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-garage-200">Top 5 Outils utilisés</h2>
          {data.topOutils.length === 0 ? (
            <p className="text-garage-500 text-center py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={data.topOutils} cx="50%" cy="45%" outerRadius={90} dataKey="value" nameKey="name">
                  {data.topOutils.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--g-800)", border: "1px solid var(--g-600)", borderRadius: "8px", color: "var(--g-50)" }} itemStyle={{ color: "var(--g-50)" }} labelStyle={{ color: "var(--g-50)" }} formatter={(value: number, name: string) => [`${value} mouvements`, name]} />
                <Legend wrapperStyle={{ paddingTop: "10px", color: "var(--g-200)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-garage-200">Top 5 Consommables</h2>
          {data.topConsommables.length === 0 ? (
            <p className="text-garage-500 text-center py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={data.topConsommables} cx="50%" cy="45%" outerRadius={90} dataKey="value" nameKey="name">
                  {data.topConsommables.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "var(--g-800)", border: "1px solid var(--g-600)", borderRadius: "8px", color: "var(--g-50)" }} itemStyle={{ color: "var(--g-50)" }} labelStyle={{ color: "var(--g-50)" }} formatter={(value: number, name: string) => [`${value} mouvements`, name]} />
                <Legend wrapperStyle={{ paddingTop: "10px", color: "var(--g-200)" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Active loans */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-garage-200">Prêts en cours</h2>
        {data.activeLoans.length === 0 ? (
          <p className="text-garage-500 text-center py-8">Aucun prêt en cours</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-garage-700 text-garage-400">
                  <th className="text-left py-2 px-3">Client</th>
                  <th className="text-left py-2 px-3">Article</th>
                  <th className="text-left py-2 px-3">Type</th>
                  <th className="text-left py-2 px-3">Date prêt</th>
                  <th className="text-left py-2 px-3">Retour prévu</th>
                  <th className="text-left py-2 px-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.activeLoans.map(loan => {
                  const isLate = new Date(loan.expectedReturn) < new Date();
                  return (
                    <tr key={loan.id} className="border-b border-garage-700/50 hover:bg-garage-700/30">
                      <td className="py-2 px-3 font-medium">{loan.firstName} {loan.lastName}</td>
                      <td className="py-2 px-3">{loan.item.name}</td>
                      <td className="py-2 px-3">{loan.item.reference}</td>
                      <td className="py-2 px-3 text-garage-400">{new Date(loan.loanDate).toLocaleDateString("fr-FR")}</td>
                      <td className={`py-2 px-3 ${isLate ? "text-red-400 font-semibold" : "text-garage-400"}`}>
                        {new Date(loan.expectedReturn).toLocaleDateString("fr-FR")}
                        {isLate && " ⚠️"}
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-xs bg-blue-900 text-blue-300">En cours</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
