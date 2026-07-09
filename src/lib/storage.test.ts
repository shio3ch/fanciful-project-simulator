import { beforeEach, describe, expect, test, vi } from "vitest";
import { clearApiKey, loadApiKey, saveApiKey } from "./storage";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

describe("storage", () => {
  test("保存して読み出せる", () => {
    saveApiKey("sk-ant-test");
    expect(loadApiKey()).toBe("sk-ant-test");
  });

  test("未保存ならnull", () => {
    expect(loadApiKey()).toBeNull();
  });

  test("削除できる", () => {
    saveApiKey("sk-ant-test");
    clearApiKey();
    expect(loadApiKey()).toBeNull();
  });

  test("localStorageが使えない環境でも例外を出さない", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadApiKey()).toBeNull();
    expect(() => saveApiKey("x")).not.toThrow();
    expect(() => clearApiKey()).not.toThrow();
  });
});
