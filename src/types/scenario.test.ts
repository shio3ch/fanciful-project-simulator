import { describe, expect, test } from "vitest";
import { ScenarioSchema, type Scenario } from "./scenario";

export const minimalScenario = {
  project: {
    name: "テストPJ", client: "テスト商事", overview: "テスト用",
    period: "3ヶ月", budget: "1000万円", difficulty: "普通",
  },
  members: [
    {
      id: "m1", name: "Null田 Pointer介", emoji: "🧑‍💻", role: "SE",
      catchphrase: "Nullチェックは気持ちで回避できます。",
      personality: "楽観的", strengths: "実装速度", weaknesses: "テスト",
      stats: { technical: 80, communication: 40, mental: 70, luck: 20 },
      specialSkill: "本番デプロイ後に気づく",
    },
  ],
  initialRelationships: [
    { from: "m1", to: "m1", type: "信頼", score: 50 },
  ],
  initialKpi: { morale: 70, quality: 70, schedule: 70, budget: 70, customerSatisfaction: 70 },
  initialTaskCount: 100,
  episodes: [
    {
      id: "e1", phase: "キックオフ", headline: "🎉 プロジェクト始動",
      summary: "始まった。", story: "始まってしまった。",
      chatLog: [{ speaker: "PM", message: "頑張りましょう" }],
      minutes: ["キックオフ実施"],
      kpiDelta: { morale: 5 },
      taskDelta: 0,
      relationshipChanges: [{ from: "m1", to: "m1", type: "信頼", delta: 5 }],
      tags: ["キックオフ"],
      projectStatus: "順調",
    },
  ],
  retrospective: {
    summary: "総評", mvp: { memberId: "m1", reason: "理由" },
    warCriminal: { memberId: "m1", reason: "理由" },
    famousQuote: "動いているので仕様です。",
    lessonsLearned: ["教訓1", "教訓2", "教訓3"],
    finalScores: { delivery: 60, quality: 50, customerSatisfaction: 70, teamwork: 80, flameLevel: 90 },
    finalComment: "コメント",
  },
} satisfies Scenario;

describe("ScenarioSchema", () => {
  test("正しいシナリオをパースできる", () => {
    expect(() => ScenarioSchema.parse(minimalScenario)).not.toThrow();
  });

  test("不正な projectStatus を拒否する", () => {
    const bad: Record<string, unknown> = structuredClone(minimalScenario);
    (bad.episodes as { projectStatus: string }[])[0].projectStatus = "大勝利";
    expect(() => ScenarioSchema.parse(bad)).toThrow();
  });

  test("members が欠けていると拒否する", () => {
    const bad: Record<string, unknown> = structuredClone(minimalScenario);
    delete bad.members;
    expect(() => ScenarioSchema.parse(bad)).toThrow();
  });
});
