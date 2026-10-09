import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const nextDark = !document.documentElement.classList.contains("dark");
    const theme = nextDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", nextDark);
    document.documentElement.style.colorScheme = theme;
    setDark(nextDark);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* Theme remains usable when storage is blocked. */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="text-foreground border-border hover:bg-accent focus-visible:outline-ring flex size-11 items-center justify-center border transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      {dark ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
