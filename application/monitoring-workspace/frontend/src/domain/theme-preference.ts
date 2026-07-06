export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

export class ThemePreferenceModel {
  public static readonly storageKey = "cicada-sense:theme-preference";

  public static defaultPreference(): ThemePreference {
    return "system";
  }

  public static isThemePreference(value: string | undefined | null): value is ThemePreference {
    return value === "system" || value === "light" || value === "dark";
  }

  public static resolve(themePreference: ThemePreference, systemTheme: ResolvedTheme): ResolvedTheme {
    if (themePreference === "system") {
      return systemTheme;
    }

    return themePreference;
  }
}
