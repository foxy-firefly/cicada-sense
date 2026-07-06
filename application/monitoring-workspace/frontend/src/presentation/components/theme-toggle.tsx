import type { ThemePreference } from "../../application/theme-preference.js";
import { messages } from "../messages.js";

const OPTIONS: Array<{ readonly label: string; readonly value: ThemePreference }> = [
  { label: messages.themeLight, value: "light" },
  { label: messages.themeDark, value: "dark" },
  { label: messages.systemTheme, value: "system" },
];

interface ThemeToggleProps {
  readonly themePreference: ThemePreference;
  readonly onChange: (themePreference: ThemePreference) => void;
}

export function ThemeToggle({ themePreference, onChange }: ThemeToggleProps) {
  return (
    <fieldset className="theme-toggle">
      <legend className="theme-toggle__label">{messages.theme}</legend>
      <div className="theme-toggle__options">
        {OPTIONS.map((option) => (
          <button
            aria-pressed={themePreference === option.value}
            className="theme-toggle__button"
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
