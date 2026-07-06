import { type ThemePreference, ThemePreferenceModel } from "../../domain/theme-preference.js";

export class ThemePreferenceStorage {
  public constructor(
    private readonly storage: Storage | undefined = typeof window === "undefined" ? undefined : window.localStorage,
  ) {}

  public read(): ThemePreference {
    const storedValue = this.storage?.getItem(ThemePreferenceModel.storageKey);
    if (!ThemePreferenceModel.isThemePreference(storedValue)) {
      return ThemePreferenceModel.defaultPreference();
    }

    return storedValue;
  }

  public write(themePreference: ThemePreference): void {
    this.storage?.setItem(ThemePreferenceModel.storageKey, themePreference);
  }
}
