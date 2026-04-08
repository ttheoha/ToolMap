"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/outils", label: "Outils", icon: "🔧" },
  { href: "/materiels", label: "Matériels", icon: "⚙️" },
  { href: "/consommables", label: "Consommables", icon: "📦" },
  { href: "/parametrage", label: "Paramétrage", icon: "⚡" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-garage-950 border-r border-garage-700 flex flex-col z-50">
      <div className="p-6 border-b border-garage-700">
        <h1 className="text-2xl font-bold text-accent">ToolMap</h1>
        <p className="text-xs text-garage-400 mt-1">Inventaire Garage</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-accent text-white"
                  : "text-garage-300 hover:bg-garage-800 hover:text-garage-100"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-garage-700">
        <p className="text-xs text-garage-500 text-center">ToolMap v1.0</p>
      </div>
    </aside>
  );
}
