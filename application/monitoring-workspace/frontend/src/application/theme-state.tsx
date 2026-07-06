import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { type ResolvedTheme, type ThemePreference, ThemePreferenceModel } from "../domain/theme-preference.js";
import { ThemePreferenceStorage } from "../infrastructure/theme/theme-preference-storage.js";

interface ThemeContextValue {
  readonly resolvedTheme: ResolvedTheme;
  readonly themePreference: ThemePreference;
  readonly setThemePreference: (themePreference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readInitialThemePreference(storage: ThemePreferenceStorage): ThemePreference {
  if (typeof document === "undefined") {
    return ThemePreferenceModel.defaultPreference();
  }

  const rootThemePreference = document.documentElement.dataset.themePreference;
  if (ThemePreferenceModel.isThemePreference(rootThemePreference)) {
    return rootThemePreference;
  }

  return storage.read();
}

function applyTheme(root: HTMLElement, themePreference: ThemePreference, resolvedTheme: ResolvedTheme): void {
  root.dataset.themePreference = themePreference;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
  const storage = useMemo(() => new ThemePreferenceStorage(), []);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => readInitialThemePreference(storage));
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystemTheme);

  const resolvedTheme = ThemePreferenceModel.resolve(themePreference, systemTheme);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (matches: boolean) => {
      setSystemTheme(matches ? "dark" : "light");
    };

    updateSystemTheme(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      updateSystemTheme(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    applyTheme(document.documentElement, themePreference, resolvedTheme);
    storage.write(themePreference);
  }, [resolvedTheme, storage, themePreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({ resolvedTheme, themePreference, setThemePreference }),
    [resolvedTheme, themePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("Theme provider is missing");
  }

  return theme;
}
