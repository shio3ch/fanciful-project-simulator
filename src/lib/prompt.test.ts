import { describe, expect, test } from "vitest";
import { buildScenarioPrompt } from "./prompt";

describe("buildScenarioPrompt", () => {
  test("重要な制約が含まれている", () => {
    const p = buildScenarioPrompt();
    expect(p).toContain("日本語");
    expect(p).toContain("あるある");
    expect(p).toContain("メンバー");
    expect(p).toContain("エピソード");
    expect(p).toContain("リリース");
  });
});
