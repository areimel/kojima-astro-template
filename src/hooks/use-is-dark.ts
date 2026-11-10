import * as React from "react";

export function useIsDark(defaultDark = true): boolean {
  const [dark, setDark] = React.useState(defaultDark);

  React.useEffect(() => {
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

  return dark;
}
