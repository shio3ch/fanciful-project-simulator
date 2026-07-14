export type ApiProvider = "anthropic" | "openai";

export type ApiSettings = {
  provider: ApiProvider;
  apiKey: string;
};

const STORAGE_KEY = "fps.apiSettings";
const LEGACY_STORAGE_KEY = "fps.apiKey";

export function loadApiSettings(): ApiSettings | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value) {
      const parsed: unknown = JSON.parse(value);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "provider" in parsed &&
        (parsed.provider === "anthropic" || parsed.provider === "openai") &&
        "apiKey" in parsed &&
        typeof parsed.apiKey === "string"
      ) {
        return { provider: parsed.provider, apiKey: parsed.apiKey };
      }
    }

    const legacyKey = localStorage.getItem(LEGACY_STORAGE_KEY);
    return legacyKey ? { provider: "anthropic", apiKey: legacyKey } : null;
  } catch {
    return null;
  }
}

export function saveApiSettings(settings: ApiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // 保存できない環境では黙って諦める（メモリ保持のみ）
  }
}

export function clearApiSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // 同上
  }
}

export function loadApiKey(): string | null {
  return loadApiSettings()?.apiKey ?? null;
}

export function saveApiKey(key: string): void {
  saveApiSettings({ provider: "anthropic", apiKey: key });
}

export function clearApiKey(): void {
  clearApiSettings();
}
