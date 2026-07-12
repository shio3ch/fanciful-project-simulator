import { describe, expect, test } from "vitest";
import { computeSeries, clamp } from "./computeState";
import { ScenarioSchema, type Scenario } from "../types/scenario";
import { minimalScenario } from "../types/scenario.test";

function makeScenario(overrides: Partial<Scenario>): Scenario {
  return ScenarioSchema.parse({ ...structuredClone(minimalScenario), ...overrides });
}

const baseEpisode = () => structuredClone(minimalScenario.episodes[0]);

describe("clamp", () => {
  test("0〜100に収める", () => {
    expect(clamp(120)).toBe(100);
    expect(clamp(-5)).toBe(0);
    expect(clamp(55)).toBe(55);
  });
});

describe("computeSeries", () => {
  test("KPIのdeltaが累積される", () => {
    const e1 = { ...baseEpisode(), id: "e1", kpiDelta: { morale: -10, quality: 5 }, relationshipChanges: [] };
    const e2 = { ...baseEpisode(), id: "e2", kpiDelta: { morale: -20 }, relationshipChanges: [] };
    const s = makeScenario({ episodes: [e1, e2] });
    const series = computeSeries(s);
    expect(series).toHaveLength(2);
    expect(series[0].kpi.morale).toBe(60); // 70 - 10
    expect(series[0].kpi.quality).toBe(75); // 70 + 5
    expect(series[1].kpi.morale).toBe(40); // 60 - 20
    expect(series[1].kpi.quality).toBe(75); // 変化なし
  });

  test("KPIは0〜100にクランプされる", () => {
    const e1 = { ...baseEpisode(), kpiDelta: { morale: -200, quality: 200 }, relationshipChanges: [] };
    const s = makeScenario({ episodes: [e1] });
    expect(computeSeries(s)[0].kpi.morale).toBe(0);
    expect(computeSeries(s)[0].kpi.quality).toBe(100);
  });

  test("タスク数が累積され0未満にならない", () => {
    const e1 = { ...baseEpisode(), id: "e1", taskDelta: 30, relationshipChanges: [] };
    const e2 = { ...baseEpisode(), id: "e2", taskDelta: -500, relationshipChanges: [] };
    const s = makeScenario({ episodes: [e1, e2], initialTaskCount: 100 });
    const series = computeSeries(s);
    expect(series[0].taskCount).toBe(130);
    expect(series[1].taskCount).toBe(0);
  });

  test("既存エッジの関係変化はscore加算とtype上書き", () => {
    const e1 = {
      ...baseEpisode(),
      relationshipChanges: [{ from: "m1", to: "m1", type: "苦手" as const, delta: -20 }],
    };
    const s = makeScenario({ episodes: [e1] }); // 初期: m1→m1 信頼 50
    const rel = computeSeries(s)[0].relationships[0];
    expect(rel.score).toBe(30);
    expect(rel.type).toBe("苦手");
  });

  test("存在しないエッジは score=50+delta で新規作成", () => {
    const e1 = {
      ...baseEpisode(),
      relationshipChanges: [{ from: "m1", to: "m9", type: "尊敬" as const, delta: 15 }],
    };
    const s = makeScenario({ episodes: [e1] });
    const rels = computeSeries(s)[0].relationships;
    const created = rels.find((r) => r.to === "m9");
    expect(created).toEqual({ from: "m1", to: "m9", type: "尊敬", score: 65 });
  });

  test("projectStatus はそのエピソードの値", () => {
    const e1 = { ...baseEpisode(), projectStatus: "炎上中" as const, relationshipChanges: [] };
    const s = makeScenario({ episodes: [e1] });
    expect(computeSeries(s)[0].projectStatus).toBe("炎上中");
  });

  test("元のシナリオオブジェクトを変更しない", () => {
    const s = makeScenario({});
    const before = JSON.stringify(s);
    computeSeries(s);
    expect(JSON.stringify(s)).toBe(before);
  });
});
