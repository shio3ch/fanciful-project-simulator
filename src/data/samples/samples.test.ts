import { describe, expect, test } from "vitest";
import { ScenarioSchema } from "../../types/scenario";
import sample1 from "./sample1.json";
import sample2 from "./sample2.json";

describe.each([
  ["sample1", sample1],
  ["sample2", sample2],
])("%s", (_name, raw) => {
  test("スキーマに適合する", () => {
    expect(() => ScenarioSchema.parse(raw)).not.toThrow();
  });

  test("メンバーID参照がすべて有効", () => {
    const s = ScenarioSchema.parse(raw);
    const ids = new Set(s.members.map((m) => m.id));
    for (const r of s.initialRelationships) {
      expect(ids.has(r.from), `from=${r.from}`).toBe(true);
      expect(ids.has(r.to), `to=${r.to}`).toBe(true);
    }
    for (const e of s.episodes) {
      for (const c of e.relationshipChanges) {
        expect(ids.has(c.from), `${e.id} from=${c.from}`).toBe(true);
        expect(ids.has(c.to), `${e.id} to=${c.to}`).toBe(true);
      }
    }
    expect(ids.has(s.retrospective.mvp.memberId)).toBe(true);
    expect(ids.has(s.retrospective.warCriminal.memberId)).toBe(true);
  });

  test("エピソードは8件以上あり最後はリリース工程", () => {
    const s = ScenarioSchema.parse(raw);
    expect(s.episodes.length).toBeGreaterThanOrEqual(8);
    expect(s.episodes[s.episodes.length - 1].phase).toBe("リリース");
  });
});
