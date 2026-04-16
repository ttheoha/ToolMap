"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold text-garage-200">Apparence</h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-garage-200 font-medium">
            {theme === "dark" ? "Mode sombre" : "Mode clair"}
          </p>
          <p className="text-xs text-garage-400">
            Basculer entre le thème clair et foncé
          </p>
        </div>
        <button
          onClick={toggle}
          className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
            theme === "dark" ? "bg-garage-500" : "bg-accent"
          }`}
          aria-label="Basculer le thème"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-sm transition-transform duration-300 ${
              theme === "light" ? "translate-x-7" : "translate-x-0"
            }`}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </span>
        </button>
      </div>
    </div>
  );
}
