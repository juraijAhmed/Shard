import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState("dark");

  function applyTheme(t) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    window.shard.setSetting("theme", t);
  }

  useEffect(() => {
    window.shard.getSetting("theme").then((saved) => {
      const t = saved || "dark";
      setTheme(t);
      document.documentElement.setAttribute("data-theme", t);
    });
  }, []);

  return { theme, applyTheme };
}
