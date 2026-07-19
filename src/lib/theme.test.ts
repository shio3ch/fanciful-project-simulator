import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  loadThemePreference,
  saveThemePreference,
  nextThemePreference,
  resolveTheme,
} from "./theme";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

describe("theme", () => {
  test("保存して読み出せる", () => {
    saveThemePreference("dark");
    expect(loadThemePreference()).toBe("dark");
  });

  test("未保存ならsystem", () => {
    expect(loadThemePreference()).toBe("system");
  });

  test("不正な保存値はsystemにフォールバック", () => {
    store.set("fps.theme", "purple");
    expect(loadThemePreference()).toBe("system");
  });

  test("light→dark→system→lightの順に巡回する", () => {
    expect(nextThemePreference("light")).toBe("dark");
    expect(nextThemePreference("dark")).toBe("system");
    expect(nextThemePreference("system")).toBe("light");
  });

  test("resolveThemeはsystemのときだけOS設定に従う", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  test("localStorageが使えない環境でも例外を出さない", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadThemePreference()).toBe("system");
    expect(() => saveThemePreference("dark")).not.toThrow();
  });
});
