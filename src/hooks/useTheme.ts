import { useCallback, useEffect } from "react";
import { usePersistentState } from "./usePersistentState";

export type Theme = "dark" | "light";

/** Dark is the default; the settings modal is the only way to leave it. */
export const DEFAULT_THEME: Theme = "dark";
export const THEME_KEY = "map:theme";

const CHROME_COLOR: Record<Theme, string> = {
  dark: "#121212",
  light: "#f7f7f7",
};

export function useTheme() {
  const [theme, setTheme] = usePersistentState<Theme>(THEME_KEY, DEFAULT_THEME);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.setAttribute("data-theme", theme);
    // Keep the browser/PWA chrome in step with the page.
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", CHROME_COLOR[theme]);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    [setTheme],
  );

  return { theme, setTheme, toggle, isDark: theme === "dark" };
}
