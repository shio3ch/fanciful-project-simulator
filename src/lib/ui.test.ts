import { describe, expect, test } from "vitest";
import { STATUS_COLORS, REL_COLORS, deltaColor, formatDelta } from "./ui";
import { ProjectStatusSchema, RelationTypeSchema } from "../types/scenario";

describe("ui", () => {
  test("全projectStatusに配色がある", () => {
    for (const s of ProjectStatusSchema.options) {
      expect(STATUS_COLORS[s]).toBeTruthy();
    }
  });

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
});
