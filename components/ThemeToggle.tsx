"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "lebihmudah-theme";

const applyThemeToDocument = (theme: ThemeMode) => {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme: ThemeMode =
      savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";

    setTheme(nextTheme);
    applyThemeToDocument(nextTheme);
    setIsReady(true);
  }, []);

  const handleToggle = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyThemeToDocument(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="fixed right-4 top-4 z-50 rounded-full border border-zinc-300 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-900 shadow-md backdrop-blur transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800"
      aria-label="Toggle theme"
    >
      {isReady
        ? theme === "dark"
          ? "Switch to Light"
          : "Switch to Dark"
        : "Theme"}
    </button>
  );
}
