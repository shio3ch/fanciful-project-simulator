import { describe, expect, test } from "vitest";
import {
  STATUS_KEYS,
  STATUS_EMOJI,
  REL_COLORS,
  deltaColor,
  deltaArrow,
  formatDelta,
} from "./ui";
import { ProjectStatusSchema, RelationTypeSchema } from "../types/scenario";

describe("ui", () => {
  test("全relationTypeに配色がある", () => {
    for (const t of RelationTypeSchema.options) {
      expect(REL_COLORS[t]).toBeTruthy();
    }
  });

  test("formatDelta は符号付きで整形する", () => {
    expect(formatDelta(15)).toBe("+15");
    expect(formatDelta(-20)).toBe("-20");
    expect(formatDelta(0)).toBe("±0");
  });

  test("deltaColor は正負でクラスが変わる", () => {
    expect(deltaColor(10)).not.toBe(deltaColor(-10));
  });

  test("deltaArrow は正負で矢印が変わる", () => {
    expect(deltaArrow(5)).toBe("▲");
    expect(deltaArrow(-5)).toBe("▼");
    expect(deltaArrow(0)).toBe("—");
  });

  test("全projectStatusにステータスキーがある", () => {
    for (const s of ProjectStatusSchema.options) {
      expect(STATUS_KEYS[s]).toBeTruthy();
    }
  });

  test("全projectStatusにバッジ絵文字がある", () => {
    for (const s of ProjectStatusSchema.options) {
      expect(STATUS_EMOJI[s]).toBeTruthy();
    }
  });
});
