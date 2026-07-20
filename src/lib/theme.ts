export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_KEY = "fps.theme";

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: "ライト",
  dark: "ダーク",
  system: "システム追従",
};

export function loadThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "light" || value === "dark" || value === "system") {
      return value;
    }
    return "system";
  } catch {
    return "system";
  }
}

export function saveThemePreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // 保存できない環境では黙って諦める（メモリ保持のみ）
  }
}

export function nextThemePreference(pref: ThemePreference): ThemePreference {
  if (pref === "light") return "dark";
  if (pref === "dark") return "system";
  return "light";
}

export function resolveTheme(
  pref: ThemePreference,
  systemDark: boolean,
): ResolvedTheme {
  if (pref === "system") return systemDark ? "dark" : "light";
  return pref;
}
