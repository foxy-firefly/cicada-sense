import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemePreferenceModel } from "../application/theme-preference.js";
import { ThemeProvider, useTheme } from "./theme-provider.js";

class MockMediaQueryList implements MediaQueryList {
  public readonly media = "(prefers-color-scheme: dark)";
  public readonly onchange = null;
  public matches: boolean;

  private readonly listeners = new Set<EventListenerOrEventListenerObject | ((event: MediaQueryListEvent) => void)>();

  public constructor(matches: boolean) {
    this.matches = matches;
  }

  public addEventListener(_type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (!listener) {
      return;
    }

    this.listeners.add(listener);
  }

  public removeEventListener(_type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (!listener) {
      return;
    }

    this.listeners.delete(listener);
  }

  public addListener(listener: (event: MediaQueryListEvent) => void): void {
    this.listeners.add(listener);
  }

  public dispatchEvent(): boolean {
    return true;
  }

  public removeListener(listener: (event: MediaQueryListEvent) => void): void {
    this.listeners.delete(listener);
  }

  public setMatches(matches: boolean): void {
    this.matches = matches;
    const event = { matches } as MediaQueryListEvent;
    for (const listener of this.listeners) {
      if (typeof listener === "function") {
        listener(event);
        continue;
      }

      listener.handleEvent(event);
    }
  }
}

function ThemeConsumer() {
  const theme = useTheme();

  return (
    <>
      <output>{theme.resolvedTheme}</output>
      <button onClick={() => theme.setThemePreference("light")} type="button">
        set light
      </button>
    </>
  );
}

function createStorageMock(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("ThemeProvider", () => {
  let mediaQueryList: MockMediaQueryList;
  let storage: Storage;

  beforeEach(() => {
    storage = createStorageMock();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });
    storage.clear();
    document.documentElement.dataset.theme = "dark";
    document.documentElement.dataset.themePreference = "system";
    mediaQueryList = new MockMediaQueryList(true);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation(() => mediaQueryList),
    });
  });

  afterEach(() => {
    storage.clear();
  });

  it("resolves the system theme from matchMedia on startup", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByText("dark")).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.themePreference).toBe("system");
  });

  it("persists an explicit theme preference", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "set light" }));

    expect(screen.getByText("light")).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(storage.getItem(ThemePreferenceModel.storageKey)).toBe("light");
  });

  it("updates the resolved theme when system mode changes", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    act(() => {
      mediaQueryList.setMatches(false);
    });

    expect(screen.getByText("light")).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
