# 空想プロジェクトシミュレーター MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AIが架空の開発プロジェクトを生成し、タイムライン連動ダッシュボードで追体験できるSPAを構築する。

**Architecture:** Vite + React + TypeScript のSPA。シナリオJSON（同梱サンプル or Claude API生成）と選択エピソードindexだけを状態とし、全ウィジェットをその純関数として描画する。KPI・タスク・人間関係は「初期値＋各エピソードのdelta」の累積計算（`computeState.ts`）で整合性を保証する。

**Tech Stack:** Vite, React 18+, TypeScript, Tailwind CSS v4, recharts, @xyflow/react, @anthropic-ai/sdk (BYOK・ブラウザ直接), zod v4, vitest

**Spec:** `docs/superpowers/specs/2026-07-09-fanciful-project-simulator-design.md`

## Global Constraints

- UI・生成コンテンツはすべて日本語
- Claude モデルは `claude-opus-4-8` 固定、`thinking: {type: "adaptive"}`、`max_tokens: 64000`、ストリーミング必須
- サンプリングパラメータ（temperature 等）は送らない（Opus 4.8 では 400 になる）
- structured outputs（`output_config.format` + `zodOutputFormat`）でシナリオJSONスキーマを強制
- APIキーの送信先は `api.anthropic.com` のみ。localStorage 保存はオプトイン
- `dangerouslySetInnerHTML` 使用禁止（XSS対策）
- 外部状態管理ライブラリは使わない（useState + props）
- KPI値は 0〜100 にクランプ、タスク数は 0 以上にクランプ
- 配色はライト基調・GitHub風の落ち着いた業務ツール調

---

### Task 1: プロジェクトスキャフォールド

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json` ほか（Viteテンプレート一式）
- Create: `src/index.css`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run dev` / `npm run build` / `npm test` が動く開発環境

- [ ] **Step 1: Vite プロジェクト生成（カレントに展開）**

```bash
cd /Users/shio3ch/workspace/fanciful-project-simulator
npm create vite@latest . -- --template react-ts
```

既存ファイル（README.md, docs/）があるため上書き確認が出たら「Ignore files and continue」相当を選ぶ。対話にならない場合は一時ディレクトリに生成して `docs`/`README.md` 以外を移動する。

- [ ] **Step 2: 依存パッケージのインストール**

```bash
npm install
npm install tailwindcss @tailwindcss/vite recharts @xyflow/react @anthropic-ai/sdk zod
npm install -D vitest
```

- [ ] **Step 3: Tailwind v4 と vitest の設定**

`vite.config.ts` を以下に置き換え:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`src/index.css` の先頭を以下だけにする（テンプレートのCSSは削除）:

```css
@import "tailwindcss";
```

`package.json` の `scripts` に追加:

```json
"test": "vitest run"
```

`tsconfig.app.json` の `compilerOptions` に `"resolveJsonModule": true` があることを確認（なければ追加）。

- [ ] **Step 4: テンプレートの不要物を削除して最小Appにする**

`src/App.tsx` を以下に置き換え、`src/App.css` と `src/assets/react.svg` を削除:

```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <h1 className="text-xl font-bold">空想プロジェクトシミュレーター</h1>
    </div>
  );
}
```

`index.html` の `<title>` を `空想プロジェクトシミュレーター` に、`<html lang="ja">` に変更。

- [ ] **Step 5: ビルド確認**

Run: `npm run build`
Expected: エラーなく `dist/` が生成される

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: Vite + React + TS + Tailwind + vitest スキャフォールド"
```

---

### Task 2: シナリオスキーマ（zod）と型定義

**Files:**
- Create: `src/types/scenario.ts`
- Test: `src/types/scenario.test.ts`

**Interfaces:**
- Produces: `ScenarioSchema`（zodスキーマ）、型 `Scenario`, `Member`, `Episode`, `Kpi`, `KpiDelta`, `Relationship`, `RelationshipChange`, `RelationType`, `Phase`, `ProjectStatus`, `ChatMessage`、定数 `KPI_KEYS`, `KPI_LABELS`

- [ ] **Step 1: 失敗するテストを書く**

`src/types/scenario.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { ScenarioSchema } from "./scenario";

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
};

describe("ScenarioSchema", () => {
  test("正しいシナリオをパースできる", () => {
    expect(() => ScenarioSchema.parse(minimalScenario)).not.toThrow();
  });

  test("不正な projectStatus を拒否する", () => {
    const bad = structuredClone(minimalScenario);
    bad.episodes[0].projectStatus = "大勝利";
    expect(() => ScenarioSchema.parse(bad)).toThrow();
  });

  test("members が欠けていると拒否する", () => {
    const bad: Record<string, unknown> = structuredClone(minimalScenario);
    delete bad.members;
    expect(() => ScenarioSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/types/scenario.test.ts`
Expected: FAIL（`./scenario` が存在しない）

- [ ] **Step 3: スキーマを実装**

`src/types/scenario.ts`:

```ts
import { z } from "zod";

export const KPI_KEYS = [
  "morale",
  "quality",
  "schedule",
  "budget",
  "customerSatisfaction",
] as const;

export const KPI_LABELS: Record<(typeof KPI_KEYS)[number], string> = {
  morale: "士気",
  quality: "品質",
  schedule: "スケジュール",
  budget: "予算",
  customerSatisfaction: "顧客満足度",
};

export const KpiSchema = z.object({
  morale: z.number(),
  quality: z.number(),
  schedule: z.number(),
  budget: z.number(),
  customerSatisfaction: z.number(),
});

export const KpiDeltaSchema = KpiSchema.partial();

export const RelationTypeSchema = z.enum([
  "尊敬",
  "信頼",
  "苦手",
  "ライバル",
  "仲良し",
]);

export const PhaseSchema = z.enum([
  "キックオフ",
  "要件定義",
  "基本設計",
  "詳細設計",
  "開発",
  "テスト",
  "リリース",
]);

export const ProjectStatusSchema = z.enum([
  "順調",
  "少し怪しい",
  "黄色信号",
  "炎上中",
  "崩壊寸前",
  "奇跡の復活",
  "無事リリース",
]);

export const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  role: z.string(),
  catchphrase: z.string(),
  personality: z.string(),
  strengths: z.string(),
  weaknesses: z.string(),
  stats: z.object({
    technical: z.number(),
    communication: z.number(),
    mental: z.number(),
    luck: z.number(),
  }),
  specialSkill: z.string(),
});

export const RelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: RelationTypeSchema,
  score: z.number(),
});

export const RelationshipChangeSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: RelationTypeSchema,
  delta: z.number(),
});

export const ChatMessageSchema = z.object({
  speaker: z.string(),
  message: z.string(),
});

export const EpisodeSchema = z.object({
  id: z.string(),
  phase: PhaseSchema,
  headline: z.string(),
  summary: z.string(),
  story: z.string(),
  chatLog: z.array(ChatMessageSchema),
  minutes: z.array(z.string()),
  kpiDelta: KpiDeltaSchema,
  taskDelta: z.number(),
  relationshipChanges: z.array(RelationshipChangeSchema),
  tags: z.array(z.string()),
  projectStatus: ProjectStatusSchema,
});

export const ScenarioSchema = z.object({
  project: z.object({
    name: z.string(),
    client: z.string(),
    overview: z.string(),
    period: z.string(),
    budget: z.string(),
    difficulty: z.string(),
  }),
  members: z.array(MemberSchema),
  initialRelationships: z.array(RelationshipSchema),
  initialKpi: KpiSchema,
  initialTaskCount: z.number(),
  episodes: z.array(EpisodeSchema),
  retrospective: z.object({
    summary: z.string(),
    mvp: z.object({ memberId: z.string(), reason: z.string() }),
    warCriminal: z.object({ memberId: z.string(), reason: z.string() }),
    famousQuote: z.string(),
    lessonsLearned: z.array(z.string()),
    finalScores: z.object({
      delivery: z.number(),
      quality: z.number(),
      customerSatisfaction: z.number(),
      teamwork: z.number(),
      flameLevel: z.number(),
    }),
    finalComment: z.string(),
  }),
});

export type Kpi = z.infer<typeof KpiSchema>;
export type KpiDelta = z.infer<typeof KpiDeltaSchema>;
export type RelationType = z.infer<typeof RelationTypeSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type RelationshipChange = z.infer<typeof RelationshipChangeSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/types/scenario.test.ts`
Expected: PASS（3件）

- [ ] **Step 5: Commit**

```bash
git add src/types
git commit -m "feat: シナリオJSONのzodスキーマと型定義"
```

---

### Task 3: 差分累積エンジン computeState

**Files:**
- Create: `src/lib/computeState.ts`
- Test: `src/lib/computeState.test.ts`

**Interfaces:**
- Consumes: `Scenario`, `Kpi`, `Relationship` 型（Task 2）
- Produces:
  - `interface SnapshotState { kpi: Kpi; taskCount: number; relationships: Relationship[]; projectStatus: ProjectStatus }`
  - `computeSeries(scenario: Scenario): SnapshotState[]` — episodes と同じ長さの配列。`series[i]` は episodes[0..i] 適用後の状態
  - `clamp(v: number, min?: number, max?: number): number`（0〜100 デフォルト）

関係変化の適用規則（テストで固定する仕様）:
- `(from, to)` が一致する既存エッジがあれば `score += delta`（0〜100クランプ）、`type` は変化の type で上書き
- 存在しなければ `score = clamp(50 + delta)` で新規エッジ作成

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/computeState.test.ts`:

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/computeState.test.ts`
Expected: FAIL（`./computeState` が存在しない）

- [ ] **Step 3: 実装**

`src/lib/computeState.ts`:

```ts
import {
  KPI_KEYS,
  type Kpi,
  type ProjectStatus,
  type Relationship,
  type Scenario,
} from "../types/scenario";

export interface SnapshotState {
  kpi: Kpi;
  taskCount: number;
  relationships: Relationship[];
  projectStatus: ProjectStatus;
}

export function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

export function computeSeries(scenario: Scenario): SnapshotState[] {
  const series: SnapshotState[] = [];
  let kpi: Kpi = { ...scenario.initialKpi };
  let taskCount = scenario.initialTaskCount;
  let relationships: Relationship[] = scenario.initialRelationships.map((r) => ({ ...r }));

  for (const episode of scenario.episodes) {
    kpi = { ...kpi };
    for (const key of KPI_KEYS) {
      const delta = episode.kpiDelta[key];
      if (delta !== undefined) kpi[key] = clamp(kpi[key] + delta);
    }

    taskCount = Math.max(0, taskCount + episode.taskDelta);

    relationships = relationships.map((r) => ({ ...r }));
    for (const change of episode.relationshipChanges) {
      const existing = relationships.find(
        (r) => r.from === change.from && r.to === change.to,
      );
      if (existing) {
        existing.score = clamp(existing.score + change.delta);
        existing.type = change.type;
      } else {
        relationships.push({
          from: change.from,
          to: change.to,
          type: change.type,
          score: clamp(50 + change.delta),
        });
      }
    }

    series.push({
      kpi,
      taskCount,
      relationships: relationships.map((r) => ({ ...r })),
      projectStatus: episode.projectStatus,
    });
  }

  return series;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/computeState.test.ts`
Expected: PASS（8件）

- [ ] **Step 5: Commit**

```bash
git add src/lib/computeState.ts src/lib/computeState.test.ts
git commit -m "feat: KPI・タスク・人間関係の差分累積エンジン"
```

---

### Task 4: サンプルシナリオ2本の同梱

**Files:**
- Create: `src/data/samples/sample1.json`
- Create: `src/data/samples/sample2.json`
- Create: `src/data/samples/index.ts`
- Test: `src/data/samples/samples.test.ts`

**Interfaces:**
- Consumes: `ScenarioSchema`（Task 2）
- Produces: `SAMPLE_SCENARIOS: Scenario[]`（バリデーション済み・2本）

- [ ] **Step 1: 失敗するテストを書く**

`src/data/samples/samples.test.ts`:

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/data/samples/samples.test.ts`
Expected: FAIL（JSONファイルが存在しない）

- [ ] **Step 3: sample1.json を作成**

テーマ:「中堅スーパーのポイントカード刷新プロジェクト」。以下のJSONをそのまま `src/data/samples/sample1.json` として保存する。

```json
{
  "project": {
    "name": "ポイントカードシステム刷新プロジェクト『NEXT-POINT』",
    "client": "株式会社マルヤス百貨店",
    "overview": "紙のスタンプカードを廃止し、スマホアプリ連動の次世代ポイントシステムを構築する。なお会長は今もガラケーである。",
    "period": "6ヶ月",
    "budget": "4,500万円",
    "difficulty": "中（のはずだった）"
  },
  "members": [
    {
      "id": "m1",
      "name": "炎上 万次郎",
      "emoji": "🧯",
      "role": "PM",
      "catchphrase": "火消しではなく防火をしたい人生だった。",
      "personality": "temperate。だが胃は限界",
      "strengths": "謝罪文の起草速度",
      "weaknesses": "NOと言うこと",
      "stats": { "technical": 55, "communication": 85, "mental": 40, "luck": 30 },
      "specialSkill": "リスケ稟議を1時間で通す"
    },
    {
      "id": "m2",
      "name": "Null田 Pointer介",
      "emoji": "🧑‍💻",
      "role": "SE",
      "catchphrase": "Nullチェックは気持ちで回避できます。",
      "personality": "根拠のない自信に満ちている",
      "strengths": "実装スピードだけは本物",
      "weaknesses": "エラーハンドリング全般",
      "stats": { "technical": 82, "communication": 45, "mental": 75, "luck": 15 },
      "specialSkill": "動くコードを書く（動くとは言っていない）"
    },
    {
      "id": "m3",
      "name": "大風呂敷 広志",
      "emoji": "💼",
      "role": "営業",
      "catchphrase": "できます！（技術的裏付けなし）",
      "personality": "太陽のように明るく、台風のように迷惑",
      "strengths": "受注力",
      "weaknesses": "仕様の理解",
      "stats": { "technical": 10, "communication": 95, "mental": 90, "luck": 80 },
      "specialSkill": "存在しない機能を受注する"
    },
    {
      "id": "m4",
      "name": "新島 いろは",
      "emoji": "🌱",
      "role": "新人エンジニア",
      "catchphrase": "gitって、grepの親戚ですか？",
      "personality": "純粋。ゆえに恐ろしい",
      "strengths": "吸収力と素直さ",
      "weaknesses": "本番と検証の区別",
      "stats": { "technical": 30, "communication": 70, "mental": 85, "luck": 60 },
      "specialSkill": "誰も踏まないバグを踏む"
    },
    {
      "id": "m5",
      "name": "沈 着冷静",
      "emoji": "🛠️",
      "role": "インフラエンジニア",
      "catchphrase": "サーバーは落ちてから育てるものです。",
      "personality": "何が起きても声のトーンが変わらない",
      "strengths": "障害対応と胆力",
      "weaknesses": "雑談",
      "stats": { "technical": 90, "communication": 35, "mental": 95, "luck": 50 },
      "specialSkill": "深夜3時に最も輝く"
    }
  ],
  "initialRelationships": [
    { "from": "m1", "to": "m3", "type": "苦手", "score": 40 },
    { "from": "m2", "to": "m5", "type": "尊敬", "score": 70 },
    { "from": "m4", "to": "m2", "type": "尊敬", "score": 65 },
    { "from": "m3", "to": "m1", "type": "信頼", "score": 60 },
    { "from": "m5", "to": "m4", "type": "仲良し", "score": 55 }
  ],
  "initialKpi": { "morale": 75, "quality": 70, "schedule": 80, "budget": 75, "customerSatisfaction": 70 },
  "initialTaskCount": 120,
  "episodes": [
    {
      "id": "e1",
      "phase": "キックオフ",
      "headline": "🎉 キックオフ、会長の一言で暗雲",
      "summary": "順調に始まるはずだったキックオフ。会長の「わしのガラケーでも動くんじゃろ？」の一言で会場が凍りつく。",
      "story": "キックオフは和やかに始まった。少なくとも最初の10分は。会長が「わしのガラケーでも動くんじゃろ？」と発言し、営業の大風呂敷が「もちろんです！」と即答するまでは。PMの炎上はその瞬間、今期3回目の胃痛を感じた。議事録には「フィーチャーフォン対応：検討」の文字が静かに刻まれた。",
      "chatLog": [
        { "speaker": "大風呂敷（営業）", "message": "ガラケー対応、いけますよね？💪" },
        { "speaker": "炎上（PM）", "message": "聞いてません" },
        { "speaker": "Null田（SE）", "message": "ガラケーにアプリって入るんでしたっけ" }
      ],
      "minutes": ["キックオフ実施、関係者32名参加", "フィーチャーフォン対応は「検討事項」として持ち帰り", "次回、要件定義キックオフを実施予定"],
      "kpiDelta": { "morale": 5, "schedule": -5 },
      "taskDelta": 5,
      "relationshipChanges": [
        { "from": "m1", "to": "m3", "type": "苦手", "delta": -10 }
      ],
      "tags": ["キックオフ", "顧客対応"],
      "projectStatus": "順調"
    },
    {
      "id": "e2",
      "phase": "要件定義",
      "headline": "📋 要件定義、要件が定義されない",
      "summary": "ヒアリングを重ねるほど要件が増殖。「ついでにレジも新しくしたい」が飛び出し、スコープが銀河系に到達。",
      "story": "要件定義会議は5回を数えた。回を重ねるごとに要件は減るどころか増えていき、ついに「ついでにレジも新しくできんかね」という発言が飛び出した。炎上PMは「それは別プロジェクトになります」と人生で最も勇気ある発言をした。会議室に沈黙が流れたが、スコープは守られた。この日、彼は少しだけPMとして成長した。",
      "chatLog": [
        { "speaker": "炎上（PM）", "message": "それは別プロジェクトになります（震え声）" },
        { "speaker": "沈（インフラ）", "message": "英断" },
        { "speaker": "大風呂敷（営業）", "message": "えっ、受注チャンスでは？" }
      ],
      "minutes": ["POSレジ刷新は本プロジェクトのスコープ外と決定", "ポイント付与率の変則パターンが37種類存在することが判明", "要件定義書v0.9を次週レビュー"],
      "kpiDelta": { "morale": -5, "schedule": -10, "customerSatisfaction": 5 },
      "taskDelta": 20,
      "relationshipChanges": [
        { "from": "m3", "to": "m1", "type": "尊敬", "delta": 10 },
        { "from": "m5", "to": "m1", "type": "尊敬", "delta": 15 }
      ],
      "tags": ["仕様変更", "顧客対応"],
      "projectStatus": "順調"
    },
    {
      "id": "e3",
      "phase": "基本設計",
      "headline": "🔥 営業、存在しない機能を受注",
      "summary": "大風呂敷が客先で「AIレコメンド機能」を約束してきた。もちろん見積にも設計にも存在しない。",
      "story": "月曜の朝、大風呂敷は爽やかに言った。「そういえば先方に、AIがおすすめ商品を提案する機能もあるって言っちゃいました！」。設計チームの時が止まった。Null田は「AIって書いてif文を実装すればいいのでは」と提案し、最悪なことに、それが採用される流れになりつつある。炎上PMの胃薬は今月2箱目に突入した。",
      "chatLog": [
        { "speaker": "大風呂敷（営業）", "message": "AIレコメンド、言っちゃいました！てへ" },
        { "speaker": "炎上（PM）", "message": "てへ、じゃないんですよ" },
        { "speaker": "Null田（SE）", "message": "if文をAIと呼ぶ勇気、僕にはあります" }
      ],
      "minutes": ["AIレコメンド機能の追加要望について協議", "実態は「よく買われている商品の表示」で合意を目指す方針", "追加費用の交渉は営業部長へエスカレーション"],
      "kpiDelta": { "morale": -15, "schedule": -15, "budget": -10 },
      "taskDelta": 25,
      "relationshipChanges": [
        { "from": "m1", "to": "m3", "type": "苦手", "delta": -20 },
        { "from": "m2", "to": "m3", "type": "ライバル", "delta": -5 }
      ],
      "tags": ["炎上", "仕様変更"],
      "projectStatus": "少し怪しい"
    },
    {
      "id": "e4",
      "phase": "詳細設計",
      "headline": "🧾 ポイント計算仕様、宇宙の法則を超える",
      "summary": "「雨の日は2倍、火曜はさらに1.5倍、ただし大安を除く」。37種の変則ルールが設計書を侵食する。",
      "story": "詳細設計は順調だった。ポイント計算仕様書を開くまでは。「雨の日ポイント2倍」「火曜市はさらに1.5倍」「ただし大安の特売日は適用外」──店舗ごとに口伝で受け継がれてきた変則ルールが37種類。しかも一部は「先代店長の気分」がロジックに含まれていた。沈は無言でホワイトボードに状態遷移図を書き始め、3時間後、それは現代アートになっていた。",
      "chatLog": [
        { "speaker": "沈（インフラ）", "message": "気象APIの契約が必要です" },
        { "speaker": "新島（新人）", "message": "『先代店長の気分』はどのテーブルに入りますか？" },
        { "speaker": "Null田（SE）", "message": "気分カラム、VARCHAR(255)でいい？" }
      ],
      "minutes": ["ポイント変則ルール37種のうち9種は廃止で店舗側と合意", "天候連動ポイントのため気象データAPIを契約", "『先代店長の気分』ルールは仕様化不能と判断し要相談"],
      "kpiDelta": { "quality": 10, "schedule": -10, "morale": -5 },
      "taskDelta": 15,
      "relationshipChanges": [
        { "from": "m4", "to": "m5", "type": "尊敬", "delta": 20 }
      ],
      "tags": ["仕様変更"],
      "projectStatus": "少し怪しい"
    },
    {
      "id": "e5",
      "phase": "開発",
      "headline": "💥 新人、本番DBを開発環境と間違える",
      "summary": "新島が「テストデータ入れておきました！」と報告。入っていたのは本番DBだった。全店舗のポイント残高に「テスト太郎」が爆誕。",
      "story": "金曜17時、新島が明るく報告した。「テストデータ、入れておきました！」。月曜9時、全店舗のレジに『テスト太郎様 保有ポイント99,999,999pt』が表示された。接続先が本番DBだったのだ。沈は無言でバックアップからのリストアを開始し、42分で復旧させた。新島は反省文を書き、Null田は「接続先を間違えられる設定にしてた僕らも悪い」と、人生で初めてまともなことを言った。",
      "chatLog": [
        { "speaker": "新島（新人）", "message": "テストデータ入れておきました！✨" },
        { "speaker": "沈（インフラ）", "message": "接続先、本番です" },
        { "speaker": "新島（新人）", "message": "本番って何ですか（純粋な目）" }
      ],
      "minutes": ["本番DB誤操作インシデントの振り返りを実施", "本番接続情報を開発端末から撤去、色分けプロンプトを導入", "リストア対応の沈氏に感謝の意を表明"],
      "kpiDelta": { "quality": -20, "morale": -10, "customerSatisfaction": -10 },
      "taskDelta": 10,
      "relationshipChanges": [
        { "from": "m4", "to": "m5", "type": "尊敬", "delta": 15 },
        { "from": "m2", "to": "m4", "type": "仲良し", "delta": 10 }
      ],
      "tags": ["炎上", "バグ"],
      "projectStatus": "黄色信号"
    },
    {
      "id": "e6",
      "phase": "開発",
      "headline": "🌋 進捗90%が3週間続く",
      "summary": "週次報告の進捗が90%から動かない。残り10%に全ての闇が詰まっていた。リリース延期がついに現実味を帯びる。",
      "story": "「進捗は90%です」。この報告が3週連続で続いた。Null田の言う90%とは「動く画面ができた」であり、残り10%には例外処理・性能・ガラケー対応検討・AIという名のif文が含まれていた。ついに炎上PMは決断する。「リリースを3週間延期します」。客先での謝罪は45分に及んだが、大風呂敷が「延期分、無料でAI機能をグレードアップします！」と余計な約束をして帰ってきた。",
      "chatLog": [
        { "speaker": "Null田（SE）", "message": "進捗90%です（3週目）" },
        { "speaker": "炎上（PM）", "message": "その90%、先週も聞きました" },
        { "speaker": "大風呂敷（営業）", "message": "朗報です！謝罪ついでに機能追加を約束してきました！" }
      ],
      "minutes": ["リリースを3週間延期することを正式決定", "残タスクの再見積を実施、『進捗90%』の定義を統一", "営業の単独顧客訪問を禁止する運用ルールを制定"],
      "kpiDelta": { "morale": -20, "schedule": -25, "budget": -15, "customerSatisfaction": -15 },
      "taskDelta": 30,
      "relationshipChanges": [
        { "from": "m1", "to": "m3", "type": "苦手", "delta": -15 },
        { "from": "m1", "to": "m2", "type": "苦手", "delta": -10 }
      ],
      "tags": ["炎上", "顧客対応"],
      "projectStatus": "炎上中"
    },
    {
      "id": "e7",
      "phase": "テスト",
      "headline": "🕳️ 結合テスト、バグ密度が観測史上最高値",
      "summary": "結合テスト初日、起票されたバグは147件。うち1件は「レシートに社長の顔文字が印字される」。チームは限界を迎えつつあった。",
      "story": "結合テスト初日、バグ管理システムに147件が起票された。ポイント2倍デーに3倍付与される、退会したはずの会員が復活する、そしてなぜかレシートに「(^o^)」が印字される──最後のバグはNull田がデバッグ用に仕込んだものだった。深夜、会議室には乾いた笑いが響いた。だが不思議なことに、この極限状態でチームの結束は静かに固まりつつあった。新島は徹夜明けの沈に無言で栄養ドリンクを差し入れた。",
      "chatLog": [
        { "speaker": "テスト担当", "message": "レシートに顔文字が出ます" },
        { "speaker": "Null田（SE）", "message": "あっ、それ僕の愛です。消します" },
        { "speaker": "沈（インフラ）", "message": "愛はコミットする前に消せ" }
      ],
      "minutes": ["結合テスト初日のバグ起票147件、トリアージを実施", "重要度Sの3件は今週中に修正", "デバッグコードの本番混入防止のためレビュー体制を強化"],
      "kpiDelta": { "quality": -10, "morale": -10 },
      "taskDelta": 20,
      "relationshipChanges": [
        { "from": "m5", "to": "m4", "type": "仲良し", "delta": 15 },
        { "from": "m5", "to": "m2", "type": "信頼", "delta": 10 }
      ],
      "tags": ["バグ", "炎上"],
      "projectStatus": "崩壊寸前"
    },
    {
      "id": "e8",
      "phase": "テスト",
      "headline": "✨ 奇跡の一週間、バグ全消化",
      "summary": "全員が覚醒した。沈の環境整備、Null田の火事場の集中力、新島の地道な再テスト。147件のバグが1週間で消えた。",
      "story": "何かが噛み合った。沈が一晩でCI環境を整備し、テストの回転速度が3倍になった。Null田は雑談を一切やめ、無言で修正コミットを積み上げた。新島は全バグの再現手順を丁寧に文書化し、再テストを黙々と回した。炎上PMは全ての会議を断り、チームを外圧から守り続けた。金曜の夕方、バグ管理システムの未対応件数が「0」になった瞬間、誰かが小さく拍手し、それは静かに全員に広がった。",
      "chatLog": [
        { "speaker": "新島（新人）", "message": "未対応バグ、0件です…！" },
        { "speaker": "炎上（PM）", "message": "全員、今日は帰ってください。命令です" },
        { "speaker": "沈（インフラ）", "message": "…悪くない金曜日" }
      ],
      "minutes": ["未対応バグ0件を達成", "受入テストを予定通り開始することを顧客と合意", "リリース判定会議を来週金曜に設定"],
      "kpiDelta": { "quality": 30, "morale": 30, "schedule": 15, "customerSatisfaction": 15 },
      "taskDelta": -80,
      "relationshipChanges": [
        { "from": "m1", "to": "m2", "type": "信頼", "delta": 30 },
        { "from": "m2", "to": "m5", "type": "尊敬", "delta": 15 },
        { "from": "m1", "to": "m3", "type": "信頼", "delta": 20 }
      ],
      "tags": ["奇跡"],
      "projectStatus": "奇跡の復活"
    },
    {
      "id": "e9",
      "phase": "リリース",
      "headline": "🚀 リリース当日、会長がガラケーで動作確認",
      "summary": "本番リリースは静かに成功。会長はガラケーを取り出したが、孫に借りたスマホで無事ポイントを確認し、満面の笑みを見せた。",
      "story": "リリース当日の朝は、拍子抜けするほど静かだった。切り替えは沈の完璧な手順書どおりに42分で完了。夕方、視察に来た会長がおもむろにガラケーを取り出した瞬間、全員の心拍数が上がったが、会長は「孫に借りたわい」とスマホを取り出し、自分のポイントが表示されると少年のように笑った。「ようやっとる」。その一言で、6ヶ月の全てが報われた気がした。なお大風呂敷は既に次の案件で「量子コンピュータ対応」を口走っている。",
      "chatLog": [
        { "speaker": "沈（インフラ）", "message": "リリース完了。全店舗、正常稼働" },
        { "speaker": "会長", "message": "ようやっとる" },
        { "speaker": "大風呂敷（営業）", "message": "次は量子ポイントカードいけますよ！" }
      ],
      "minutes": ["本番リリース完了、全138店舗で正常稼働を確認", "リリース後1週間はハイパーケア体制を継続", "打ち上げは全員参加で開催決定（会長も来る）"],
      "kpiDelta": { "morale": 15, "customerSatisfaction": 25, "quality": 5 },
      "taskDelta": -20,
      "relationshipChanges": [
        { "from": "m1", "to": "m3", "type": "仲良し", "delta": 10 }
      ],
      "tags": ["リリース"],
      "projectStatus": "無事リリース"
    }
  ],
  "retrospective": {
    "summary": "存在しない機能の受注、本番DB汚染、進捗90%の3週間、そして147件のバグ。あらゆる「開発現場あるある」を踏み抜きながら、最後の一週間でチームは別の生き物になった。リリース延期は3週間で済み、顧客満足度はむしろ開始時を上回った。これはもう、勝ちである。",
    "mvp": { "memberId": "m5", "reason": "本番DB復旧42分、CI環境一晩構築、リリース手順書に誤字ゼロ。声を荒げたことは一度もない。全プロジェクトに一人欲しい人材。" },
    "warCriminal": { "memberId": "m3", "reason": "存在しない機能を2回受注し、謝罪の場で機能追加を約束した罪。ただし受注がなければこのプロジェクト自体が存在しなかったため、功罪相半ばする（罪が7割）。" },
    "famousQuote": "愛はコミットする前に消せ",
    "lessonsLearned": [
      "営業を単独で客先に行かせてはならない",
      "本番と開発の接続先は物理的に分離せよ",
      "『進捗90%』という報告に90%の意味はない",
      "口伝のビジネスルールは要件定義の最初に掘り起こせ",
      "奇跡は起きる。ただしそれまでの地道な準備があった場合に限る"
    ],
    "finalScores": { "delivery": 65, "quality": 80, "customerSatisfaction": 85, "teamwork": 90, "flameLevel": 75 },
    "finalComment": "炎上度75点は誇れる数字ではないが、チームワーク90点はどんな優良プロジェクトにも負けていない。次のプロジェクトでは、大風呂敷氏の発言録音を推奨する。"
  }
}
```

- [ ] **Step 4: sample2.json を作成**

テーマ:「老舗和菓子屋『鶴乃屋』のECサイト構築プロジェクト」。sample1 と同じスキーマ・同じトーン（開発あるある×ユーモア）で、以下の仕様を満たすJSONを書く:

- メンバー5人: `m1` 石橋 叩子（PM・石橋を叩きすぎて壊すタイプ）/ `m2` 徹夜 明（フロントエンド・CSSに命を懸ける）/ `m3` 仕様 変更太（顧客側担当者・思いつきで仕様を変える名人）/ `m4` 保守 的雄（ベテランSE・新技術全部反対）/ `m5` 独学 隼人（若手フルスタック・フレームワークを毎週乗り換える）
- エピソード8件、phase は キックオフ→要件定義→基本設計→詳細設計→開発→開発→テスト→リリース の順
- 盛り込む見出し例: 「🍡 女将、Amazonでよくない？と言い出す」「🎨 デザイン案、97回目の修正」「📦 在庫連携、FAXが最強のAPIだった」「🐛 決済テストで全員が和菓子を買いすぎる」など
- KPI推移は中盤に一度「炎上中」まで悪化し、終盤「奇跡の復活」→「無事リリース」で終わる
- `initialKpi` は全項目60〜80、`initialTaskCount` は80〜150 の範囲
- retrospective の famousQuote は「FAXも、APIです。」とする

- [ ] **Step 5: index.ts を作成**

`src/data/samples/index.ts`:

```ts
import { ScenarioSchema, type Scenario } from "../../types/scenario";
import sample1 from "./sample1.json";
import sample2 from "./sample2.json";

export const SAMPLE_SCENARIOS: Scenario[] = [
  ScenarioSchema.parse(sample1),
  ScenarioSchema.parse(sample2),
];
```

- [ ] **Step 6: テストが通ることを確認**

Run: `npx vitest run src/data/samples/samples.test.ts`
Expected: PASS（6件）

- [ ] **Step 7: Commit**

```bash
git add src/data
git commit -m "feat: 同梱サンプルシナリオ2本を追加"
```

---

### Task 5: APIキーストレージ

**Files:**
- Create: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

**Interfaces:**
- Produces: `loadApiKey(): string | null`, `saveApiKey(key: string): void`, `clearApiKey(): void`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/storage.test.ts`（vitest の `environment: "jsdom"` は使わず、localStorage をモックする）:

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: FAIL（`./storage` が存在しない）

- [ ] **Step 3: 実装**

`src/lib/storage.ts`:

```ts
const STORAGE_KEY = "fps.apiKey";

export function loadApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // 保存できない環境では黙って諦める（メモリ保持のみ）
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 同上
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS（4件）

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: APIキーのlocalStorage管理"
```

---

### Task 6: 生成プロンプトと Claude API 呼び出し

**Files:**
- Create: `src/lib/prompt.ts`
- Create: `src/lib/generateScenario.ts`
- Test: `src/lib/prompt.test.ts`

**Interfaces:**
- Consumes: `ScenarioSchema`, `Scenario`（Task 2）
- Produces:
  - `buildScenarioPrompt(): string`
  - `generateScenario(apiKey: string, onProgress?: (charCount: number) => void): Promise<Scenario>`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/prompt.test.ts`:

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/prompt.test.ts`
Expected: FAIL（`./prompt` が存在しない）

- [ ] **Step 3: prompt.ts を実装**

`src/lib/prompt.ts`:

```ts
export function buildScenarioPrompt(): string {
  return `あなたは架空のシステム開発プロジェクトを生成するゲームマスターです。
エンジニアが思わず笑ってしまう「開発現場あるある」に満ちた、架空プロジェクトの一部始終をシミュレーションしてください。

# 全体の要件
- すべて日本語で書く
- 業務ツール風の淡々としたトーンの中に、じわじわ笑えるユーモアを仕込む
- 実在の企業名・人名は使わない。ダジャレの効いた架空の固有名詞を使う（例: Null田 Pointer介、炎上 万次郎）

# 生成する内容
1. プロジェクト概要: 名前・顧客・システム概要・開発期間・予算・難易度。少し不穏な予感を漂わせる
2. メンバー: 4〜6人。id は "m1" から連番。名前は開発あるあるを体現したダジャレ。役職・キャッチコピー・性格・得意/苦手・能力値(0〜100)・特殊スキルを持つ
3. 初期人間関係 (initialRelationships): 4〜6本のエッジ。type は 尊敬/信頼/苦手/ライバル/仲良し、score は 0〜100
4. 初期KPI (initialKpi): 各項目 60〜85
5. 初期残タスク数 (initialTaskCount): 80〜150
6. エピソード (episodes): 8〜12件。id は "e1" から連番。phase は キックオフ→要件定義→基本設計→詳細設計→開発→テスト→リリース の順に進める（同じ工程が続いてもよい。最後は必ずリリース）
   - headline は絵文字付きのニュース見出し（例: 🔥 営業、存在しない機能を受注）
   - summary は2〜3行、story は150〜300字の読み物
   - chatLog はSlack風の会話3〜5件（オチをつける）
   - minutes は会議議事録風の箇条書き2〜4件
   - kpiDelta は -30〜+30 程度の変化（変化しない項目は省略可）
   - taskDelta はタスク増減（仕様追加で増、消化で減）
   - relationshipChanges はメンバーIDを参照し、delta は -30〜+30
   - projectStatus は物語の起伏に合わせる: 序盤は順調、中盤で炎上中〜崩壊寸前まで悪化し、終盤に奇跡の復活を経て無事リリースで終わる
7. 振り返り (retrospective): 総評、MVP（最も活躍した人）、戦犯（ユーモアとして表現し、フォローも入れる）、名言、Lessons Learned 3〜5件、最終評価(0〜100)、総合コメント

# 注意
- relationshipChanges と mvp/warCriminal の memberId は必ず members に存在する id を使う
- 物語として一貫させる。前のエピソードの出来事を後のエピソードが引き継ぐ
- 露悪的・攻撃的にしない。愛のあるユーモアで書く`;
}
```

- [ ] **Step 4: generateScenario.ts を実装**

`src/lib/generateScenario.ts`（API呼び出しのためユニットテスト対象外。ビルドが通ることと Task 12 の手動確認で検証する）:

```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ScenarioSchema, type Scenario } from "../types/scenario";
import { buildScenarioPrompt } from "./prompt";

export async function generateScenario(
  apiKey: string,
  onProgress?: (charCount: number) => void,
): Promise<Scenario> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  let received = 0;
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: { format: zodOutputFormat(ScenarioSchema, "scenario") },
    messages: [{ role: "user", content: buildScenarioPrompt() }],
  });

  stream.on("text", (delta) => {
    received += delta.length;
    onProgress?.(received);
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "max_tokens") {
    throw new Error("生成が長すぎて途中で打ち切られました。もう一度お試しください。");
  }

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AIの応答にテキストが含まれていませんでした。");
  }

  return ScenarioSchema.parse(JSON.parse(textBlock.text));
}
```

注意: `zodOutputFormat` のシグネチャがSDKバージョンで異なる場合（name引数の有無）は、コンパイルエラーに従って修正する。structured outputs が使えない場合のフォールバックとして `output_config` を外し、プロンプト末尾に「JSONのみを出力せよ」と追記する実装に切り替えてよい（zodパースは必ず残す）。

- [ ] **Step 5: テストとビルドが通ることを確認**

Run: `npx vitest run src/lib/prompt.test.ts && npm run build`
Expected: テストPASS、ビルド成功

- [ ] **Step 6: Commit**

```bash
git add src/lib/prompt.ts src/lib/prompt.test.ts src/lib/generateScenario.ts
git commit -m "feat: シナリオ生成プロンプトとClaude API呼び出し"
```

---

### Task 7: UIユーティリティ（ステータス配色・タグ配色）

**Files:**
- Create: `src/lib/ui.ts`
- Test: `src/lib/ui.test.ts`

**Interfaces:**
- Consumes: `ProjectStatus`, `RelationType`（Task 2）
- Produces: `STATUS_COLORS: Record<ProjectStatus, string>`, `REL_COLORS: Record<RelationType, string>`, `deltaColor(v: number): string`, `formatDelta(v: number): string`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/ui.test.ts`:

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/ui.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装**

`src/lib/ui.ts`:

```ts
import type { ProjectStatus, RelationType } from "../types/scenario";

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  順調: "bg-emerald-100 text-emerald-800 border-emerald-300",
  少し怪しい: "bg-lime-100 text-lime-800 border-lime-300",
  黄色信号: "bg-amber-100 text-amber-800 border-amber-300",
  炎上中: "bg-orange-100 text-orange-800 border-orange-300",
  崩壊寸前: "bg-red-100 text-red-800 border-red-300",
  奇跡の復活: "bg-sky-100 text-sky-800 border-sky-300",
  無事リリース: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export const REL_COLORS: Record<RelationType, string> = {
  尊敬: "#0ea5e9",
  信頼: "#10b981",
  苦手: "#f59e0b",
  ライバル: "#8b5cf6",
  仲良し: "#ec4899",
};

export function formatDelta(v: number): string {
  if (v > 0) return `+${v}`;
  if (v < 0) return `${v}`;
  return "±0";
}

export function deltaColor(v: number): string {
  if (v > 0) return "text-emerald-600";
  if (v < 0) return "text-red-600";
  return "text-slate-500";
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/ui.test.ts`
Expected: PASS（4件）

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui.ts src/lib/ui.test.ts
git commit -m "feat: ステータス・関係タイプの配色ユーティリティ"
```

---

### Task 8: レイアウト骨格と Header / ProjectSummary

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/ProjectSummary.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `SAMPLE_SCENARIOS`（Task 4）、`computeSeries`（Task 3）、`STATUS_COLORS`（Task 7）
- Produces:
  - `Header({ onOpenSettings, onGenerate, onSelectSample, generating, hasApiKey }: { onOpenSettings: () => void; onGenerate: () => void; onSelectSample: (index: number) => void; generating: boolean; hasApiKey: boolean })`
  - `ProjectSummary({ scenario, snapshot, currentPhase }: { scenario: Scenario; snapshot: SnapshotState; currentPhase: string })`
  - App の状態構造: `scenario`, `selectedIndex`, `apiKey`, `settingsOpen`, `generating`, `progressChars`, `error`（以降のタスクはこの App に組み込んでいく）

- [ ] **Step 1: Header を実装**

`src/components/Header.tsx`:

```tsx
export default function Header({
  onOpenSettings,
  onGenerate,
  onSelectSample,
  generating,
  hasApiKey,
}: {
  onOpenSettings: () => void;
  onGenerate: () => void;
  onSelectSample: (index: number) => void;
  generating: boolean;
  hasApiKey: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-10">
      <h1 className="text-lg font-bold tracking-tight">
        🎭 空想プロジェクトシミュレーター
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <select
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value !== "") onSelectSample(Number(e.target.value));
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            サンプルを読み込む…
          </option>
          <option value="0">サンプル1: ポイントカード刷新</option>
          <option value="1">サンプル2: 和菓子屋EC構築</option>
        </select>
        <button
          onClick={onGenerate}
          disabled={generating || !hasApiKey}
          title={hasApiKey ? "" : "設定からAPIキーを登録してください"}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {generating ? "生成中…" : "✨ 新規プロジェクト生成"}
        </button>
        <button
          onClick={onOpenSettings}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          ⚙️ 設定
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: ProjectSummary を実装**

`src/components/ProjectSummary.tsx`:

```tsx
import type { Scenario } from "../types/scenario";
import type { SnapshotState } from "../lib/computeState";
import { STATUS_COLORS } from "../lib/ui";

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export default function ProjectSummary({
  scenario,
  snapshot,
  currentPhase,
}: {
  scenario: Scenario;
  snapshot: SnapshotState;
  currentPhase: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-bold">{scenario.project.name}</h2>
        <span
          className={`rounded-full border px-3 py-0.5 text-xs font-bold ${STATUS_COLORS[snapshot.projectStatus]}`}
        >
          {snapshot.projectStatus}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{scenario.project.overview}</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Item label="顧客" value={scenario.project.client} />
        <Item label="開発期間" value={scenario.project.period} />
        <Item label="予算" value={scenario.project.budget} />
        <Item label="難易度" value={scenario.project.difficulty} />
        <Item label="現在工程" value={currentPhase} />
      </dl>
    </section>
  );
}
```

- [ ] **Step 3: App.tsx に組み込む**

`src/App.tsx` を以下に置き換え:

```tsx
import { useMemo, useState } from "react";
import type { Scenario } from "./types/scenario";
import { computeSeries } from "./lib/computeState";
import { loadApiKey } from "./lib/storage";
import { SAMPLE_SCENARIOS } from "./data/samples";
import Header from "./components/Header";
import ProjectSummary from "./components/ProjectSummary";

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(SAMPLE_SCENARIOS[0]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [apiKey, setApiKey] = useState<string>(() => loadApiKey() ?? "");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progressChars, setProgressChars] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const series = useMemo(() => computeSeries(scenario), [scenario]);
  const snapshot = series[selectedIndex];
  const episode = scenario.episodes[selectedIndex];

  function loadScenario(next: Scenario) {
    setScenario(next);
    setSelectedIndex(0);
    setError(null);
  }

  async function handleGenerate() {
    // Task 12 で実装
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onGenerate={handleGenerate}
        onSelectSample={(i) => loadScenario(SAMPLE_SCENARIOS[i])}
        generating={generating}
        hasApiKey={apiKey.length > 0}
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <ProjectSummary
          scenario={scenario}
          snapshot={snapshot}
          currentPhase={episode.phase}
        />
      </main>
    </div>
  );
}
```

（`settingsOpen` / `generating` / `progressChars` / `setApiKey` はこの時点では未使用警告が出るため、`void settingsOpen;` のような一時抑制はせず、tsconfig の `noUnusedLocals` が有効でビルドが落ちる場合のみ、該当stateの宣言を後続タスクまでコメントアウトして進める）

- [ ] **Step 4: 目視確認とビルド**

Run: `npm run build`
Expected: 成功（落ちる場合は上記の未使用変数対応）

`npm run dev` でブラウザを開き、ヘッダーとプロジェクトサマリ（サンプル1）が表示されることを確認。

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components
git commit -m "feat: レイアウト骨格・ヘッダー・プロジェクトサマリ"
```

---

### Task 9: Timeline と EpisodeDetail

**Files:**
- Create: `src/components/Timeline.tsx`
- Create: `src/components/EpisodeDetail.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Episode`, `Scenario`（Task 2）、`STATUS_COLORS`, `formatDelta`, `deltaColor`（Task 7）、`KPI_LABELS`, `KPI_KEYS`
- Produces:
  - `Timeline({ scenario, selectedIndex, onSelect }: { scenario: Scenario; selectedIndex: number; onSelect: (i: number) => void })`
  - `EpisodeDetail({ episode, members }: { episode: Episode; members: Member[] })`

- [ ] **Step 1: Timeline を実装**

`src/components/Timeline.tsx`:

```tsx
import type { Scenario } from "../types/scenario";

export default function Timeline({
  scenario,
  selectedIndex,
  onSelect,
}: {
  scenario: Scenario;
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-slate-700">📅 タイムライン</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {scenario.episodes.map((ep, i) => {
          const selected = i === selectedIndex;
          const past = i <= selectedIndex;
          return (
            <button
              key={ep.id}
              onClick={() => onSelect(i)}
              className={`min-w-36 shrink-0 rounded-md border p-2 text-left transition ${
                selected
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : past
                    ? "border-slate-300 bg-white hover:bg-slate-50"
                    : "border-slate-200 bg-slate-50 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="text-[10px] font-bold text-slate-500">
                {i + 1}. {ep.phase}
              </div>
              <div className="mt-0.5 line-clamp-2 text-xs">{ep.headline}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: EpisodeDetail を実装**

`src/components/EpisodeDetail.tsx`:

```tsx
import { KPI_KEYS, KPI_LABELS, type Episode, type Member } from "../types/scenario";
import { deltaColor, formatDelta } from "../lib/ui";

export default function EpisodeDetail({
  episode,
  members,
}: {
  episode: Episode;
  members: Member[];
}) {
  const nameOf = (id: string) =>
    members.find((m) => m.id === id)?.name ?? id;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">{episode.headline}</h2>
        {episode.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            #{t}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-600">{episode.summary}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{episode.story}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold text-slate-500">💬 チャット抜粋</h3>
          <div className="mt-2 space-y-2 rounded-md bg-slate-50 p-3">
            {episode.chatLog.map((c, i) => (
              <div key={i} className="text-sm">
                <span className="font-bold text-slate-700">{c.speaker}</span>
                <p className="mt-0.5 rounded-md bg-white px-3 py-1.5 shadow-sm">
                  {c.message}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500">📝 議事録抜粋</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {episode.minutes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500">📊 KPI変化</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {KPI_KEYS.filter((k) => episode.kpiDelta[k] !== undefined).map((k) => (
                <span key={k} className={`text-sm font-bold ${deltaColor(episode.kpiDelta[k]!)}`}>
                  {KPI_LABELS[k]} {formatDelta(episode.kpiDelta[k]!)}
                </span>
              ))}
              <span className={`text-sm font-bold ${deltaColor(-episode.taskDelta)}`}>
                残タスク {formatDelta(episode.taskDelta)}
              </span>
            </div>
          </div>
          {episode.relationshipChanges.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500">🤝 人間関係の変化</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {episode.relationshipChanges.map((c, i) => (
                  <li key={i}>
                    {nameOf(c.from)} → {nameOf(c.to)}（{c.type}{" "}
                    <span className={deltaColor(c.delta)}>{formatDelta(c.delta)}</span>）
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: App に組み込む**

`src/App.tsx` の `<main>` 内、`<ProjectSummary … />` の後に追加:

```tsx
<Timeline
  scenario={scenario}
  selectedIndex={selectedIndex}
  onSelect={setSelectedIndex}
/>
<EpisodeDetail episode={episode} members={scenario.members} />
```

import を追加:

```tsx
import Timeline from "./components/Timeline";
import EpisodeDetail from "./components/EpisodeDetail";
```

- [ ] **Step 4: 目視確認とビルド**

Run: `npm run build`
Expected: 成功

`npm run dev` で、タイムラインのクリックでエピソード詳細とサマリのステータスバッジが連動して変わることを確認。

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/Timeline.tsx src/components/EpisodeDetail.tsx
git commit -m "feat: タイムラインとエピソード詳細（連動表示）"
```

---

### Task 10: MemberList / HealthCheck / BurndownChart

**Files:**
- Create: `src/components/MemberList.tsx`
- Create: `src/components/HealthCheck.tsx`
- Create: `src/components/BurndownChart.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Member`, `Kpi`, `KPI_KEYS`, `KPI_LABELS`（Task 2）、`SnapshotState`, `computeSeries` の戻り値（Task 3）
- Produces:
  - `MemberList({ members }: { members: Member[] })`
  - `HealthCheck({ series, selectedIndex }: { series: SnapshotState[]; selectedIndex: number })`
  - `BurndownChart({ scenario, series, selectedIndex }: { scenario: Scenario; series: SnapshotState[]; selectedIndex: number })`

- [ ] **Step 1: MemberList を実装**

`src/components/MemberList.tsx`:

```tsx
import type { Member } from "../types/scenario";

const STAT_LABELS = [
  ["technical", "技術"],
  ["communication", "コミュ"],
  ["mental", "メンタル"],
  ["luck", "運"],
] as const;

function MemberCard({ member }: { member: Member }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{member.emoji}</span>
        <div>
          <div className="text-sm font-bold">{member.name}</div>
          <div className="text-xs text-slate-500">{member.role}</div>
        </div>
      </div>
      <p className="mt-2 text-xs italic text-slate-600">「{member.catchphrase}」</p>
      <dl className="mt-2 space-y-0.5 text-xs text-slate-600">
        <div>性格: {member.personality}</div>
        <div>得意: {member.strengths} / 苦手: {member.weaknesses}</div>
        <div className="font-medium text-indigo-700">✨ {member.specialSkill}</div>
      </dl>
      <div className="mt-2 space-y-1">
        {STAT_LABELS.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-[10px]">
            <span className="w-12 text-slate-500">{label}</span>
            <div className="h-1.5 flex-1 rounded bg-slate-100">
              <div
                className="h-1.5 rounded bg-indigo-400"
                style={{ width: `${member.stats[key]}%` }}
              />
            </div>
            <span className="w-6 text-right text-slate-500">{member.stats[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemberList({ members }: { members: Member[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-slate-700">👥 メンバー</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: HealthCheck を実装**

`src/components/HealthCheck.tsx`:

```tsx
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KPI_KEYS, KPI_LABELS } from "../types/scenario";
import type { SnapshotState } from "../lib/computeState";

const LINE_COLORS: Record<(typeof KPI_KEYS)[number], string> = {
  morale: "#6366f1",
  quality: "#10b981",
  schedule: "#f59e0b",
  budget: "#0ea5e9",
  customerSatisfaction: "#ec4899",
};

export default function HealthCheck({
  series,
  selectedIndex,
}: {
  series: SnapshotState[];
  selectedIndex: number;
}) {
  const current = series[selectedIndex].kpi;
  const data = series.map((s, i) => ({ name: `${i + 1}`, ...s.kpi }));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-slate-700">🩺 プロジェクト健康診断</h2>
      <div className="space-y-1.5">
        {KPI_KEYS.map((k) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-slate-500">{KPI_LABELS[k]}</span>
            <div className="h-2 flex-1 rounded bg-slate-100">
              <div
                className="h-2 rounded transition-all"
                style={{ width: `${current[k]}%`, backgroundColor: LINE_COLORS[k] }}
              />
            </div>
            <span className="w-8 text-right font-bold">{current[k]}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v, name) => [v, KPI_LABELS[name as (typeof KPI_KEYS)[number]]]}
            />
            <ReferenceLine x={`${selectedIndex + 1}`} stroke="#94a3b8" strokeDasharray="4 4" />
            {KPI_KEYS.map((k) => (
              <Line
                key={k}
                dataKey={k}
                stroke={LINE_COLORS[k]}
                dot={false}
                strokeWidth={1.5}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: BurndownChart を実装**

`src/components/BurndownChart.tsx`:

```tsx
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Scenario } from "../types/scenario";
import type { SnapshotState } from "../lib/computeState";

export default function BurndownChart({
  scenario,
  series,
  selectedIndex,
}: {
  scenario: Scenario;
  series: SnapshotState[];
  selectedIndex: number;
}) {
  const data = [
    { name: "開始", tasks: scenario.initialTaskCount },
    ...series.map((s, i) => ({
      name: `${i + 1}. ${scenario.episodes[i].phase}`,
      tasks: s.taskCount,
    })),
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-slate-700">📉 バーンダウンチャート（残タスク数）</h2>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <ReferenceLine
              x={data[selectedIndex + 1].name}
              stroke="#6366f1"
              strokeDasharray="4 4"
              label={{ value: "現在", fontSize: 10, fill: "#6366f1" }}
            />
            <Area dataKey="tasks" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: App に組み込む**

`src/App.tsx` の `<main>` 内を以下の構成にする（ProjectSummary と Timeline の間に3カラム帯とバーンダウンを挿入）:

```tsx
<ProjectSummary scenario={scenario} snapshot={snapshot} currentPhase={episode.phase} />
<div className="grid gap-4 lg:grid-cols-3">
  <MemberList members={scenario.members} />
  <div className="lg:col-span-1">{/* Task 11 で RelationshipMap を配置 */}</div>
  <HealthCheck series={series} selectedIndex={selectedIndex} />
</div>
<BurndownChart scenario={scenario} series={series} selectedIndex={selectedIndex} />
<Timeline scenario={scenario} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
<EpisodeDetail episode={episode} members={scenario.members} />
```

import を追加:

```tsx
import MemberList from "./components/MemberList";
import HealthCheck from "./components/HealthCheck";
import BurndownChart from "./components/BurndownChart";
```

- [ ] **Step 5: 目視確認とビルド**

Run: `npm run build`
Expected: 成功

`npm run dev` で、タイムライン選択に応じて健康診断バー・折れ線の現在位置・バーンダウンの「現在」線が連動することを確認。

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/MemberList.tsx src/components/HealthCheck.tsx src/components/BurndownChart.tsx
git commit -m "feat: メンバー一覧・健康診断・バーンダウンチャート"
```

---

### Task 11: RelationshipMap（React Flow）

**Files:**
- Create: `src/components/RelationshipMap.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Member`, `Relationship`（Task 2）、`REL_COLORS`（Task 7）
- Produces: `RelationshipMap({ members, relationships }: { members: Member[]; relationships: Relationship[] })`

- [ ] **Step 1: 実装**

`src/components/RelationshipMap.tsx`:

```tsx
import { useMemo } from "react";
import { Background, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Member, Relationship } from "../types/scenario";
import { REL_COLORS } from "../lib/ui";

function buildNodes(members: Member[]): Node[] {
  const cx = 170;
  const cy = 150;
  const r = 110;
  return members.map((m, i) => {
    const angle = (2 * Math.PI * i) / members.length - Math.PI / 2;
    return {
      id: m.id,
      position: { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) },
      data: { label: `${m.emoji} ${m.name}` },
      style: {
        fontSize: 10,
        padding: "4px 6px",
        borderRadius: 8,
        border: "1px solid #cbd5e1",
        width: "auto",
      },
    };
  });
}

function buildEdges(relationships: Relationship[]): Edge[] {
  return relationships.map((rel, i) => ({
    id: `rel-${i}`,
    source: rel.from,
    target: rel.to,
    label: `${rel.type} ${rel.score}`,
    labelStyle: { fontSize: 9, fill: REL_COLORS[rel.type] },
    style: {
      stroke: REL_COLORS[rel.type],
      strokeWidth: Math.max(1, rel.score / 30),
      opacity: 0.8,
    },
    animated: rel.score < 30,
  }));
}

export default function RelationshipMap({
  members,
  relationships,
}: {
  members: Member[];
  relationships: Relationship[];
}) {
  const nodes = useMemo(() => buildNodes(members), [members]);
  const edges = useMemo(() => buildEdges(relationships), [relationships]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-slate-700">🕸️ 人間関係マップ</h2>
      <div className="h-72">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnDrag={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} />
        </ReactFlow>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
        {Object.entries(REL_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: App に組み込む**

Task 10 で置いたプレースホルダー `<div className="lg:col-span-1">…</div>` を以下に置き換え:

```tsx
<RelationshipMap members={scenario.members} relationships={snapshot.relationships} />
```

import を追加:

```tsx
import RelationshipMap from "./components/RelationshipMap";
```

- [ ] **Step 3: 目視確認とビルド**

Run: `npm run build`
Expected: 成功

`npm run dev` で、タイムラインを進めるとエッジの太さ・ラベル・タイプが変化することを確認（sample1 では e3 以降で m1→m3 が悪化していく）。

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/RelationshipMap.tsx
git commit -m "feat: React Flowによる人間関係マップ"
```

---

### Task 12: Retrospective / SettingsModal / GeneratingOverlay と生成フロー統合

**Files:**
- Create: `src/components/Retrospective.tsx`
- Create: `src/components/SettingsModal.tsx`
- Create: `src/components/GeneratingOverlay.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `generateScenario`（Task 6）、`saveApiKey`/`clearApiKey`（Task 5）
- Produces:
  - `Retrospective({ scenario }: { scenario: Scenario })`
  - `SettingsModal({ apiKey, onSave, onClose }: { apiKey: string; onSave: (key: string, persist: boolean) => void; onClose: () => void })`
  - `GeneratingOverlay({ progressChars }: { progressChars: number })`

- [ ] **Step 1: Retrospective を実装**

`src/components/Retrospective.tsx`:

```tsx
import type { Scenario } from "../types/scenario";

const SCORE_LABELS = [
  ["delivery", "納期"],
  ["quality", "品質"],
  ["customerSatisfaction", "顧客満足度"],
  ["teamwork", "チームワーク"],
  ["flameLevel", "炎上度"],
] as const;

export default function Retrospective({ scenario }: { scenario: Scenario }) {
  const r = scenario.retrospective;
  const nameOf = (id: string) =>
    scenario.members.find((m) => m.id === id)?.name ?? id;
  const emojiOf = (id: string) =>
    scenario.members.find((m) => m.id === id)?.emoji ?? "❓";

  return (
    <section className="rounded-lg border-2 border-indigo-200 bg-white p-5">
      <h2 className="text-lg font-bold">🏁 最終振り返り</h2>
      <p className="mt-2 text-sm leading-relaxed">{r.summary}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-amber-50 p-3">
          <h3 className="text-xs font-bold text-amber-700">🏆 MVP</h3>
          <div className="mt-1 text-sm font-bold">
            {emojiOf(r.mvp.memberId)} {nameOf(r.mvp.memberId)}
          </div>
          <p className="mt-1 text-xs text-slate-600">{r.mvp.reason}</p>
        </div>
        <div className="rounded-md bg-slate-100 p-3">
          <h3 className="text-xs font-bold text-slate-600">💀 戦犯（愛を込めて）</h3>
          <div className="mt-1 text-sm font-bold">
            {emojiOf(r.warCriminal.memberId)} {nameOf(r.warCriminal.memberId)}
          </div>
          <p className="mt-1 text-xs text-slate-600">{r.warCriminal.reason}</p>
        </div>
      </div>

      <blockquote className="mt-4 border-l-4 border-indigo-300 pl-4 text-base font-bold italic text-slate-700">
        「{r.famousQuote}」
      </blockquote>

      <div className="mt-4">
        <h3 className="text-xs font-bold text-slate-500">📚 Lessons Learned</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {r.lessonsLearned.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-bold text-slate-500">🎯 最終評価</h3>
        <div className="mt-2 space-y-1.5">
          {SCORE_LABELS.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-slate-500">{label}</span>
              <div className="h-2 flex-1 rounded bg-slate-100">
                <div
                  className={`h-2 rounded ${key === "flameLevel" ? "bg-red-400" : "bg-indigo-400"}`}
                  style={{ width: `${r.finalScores[key]}%` }}
                />
              </div>
              <span className="w-8 text-right font-bold">{r.finalScores[key]}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-md bg-indigo-50 p-3 text-sm">{r.finalComment}</p>
    </section>
  );
}
```

- [ ] **Step 2: SettingsModal を実装**

`src/components/SettingsModal.tsx`:

```tsx
import { useState } from "react";

export default function SettingsModal({
  apiKey,
  onSave,
  onClose,
}: {
  apiKey: string;
  onSave: (key: string, persist: boolean) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(apiKey);
  const [persist, setPersist] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold">⚙️ 設定</h2>
        <label className="mt-4 block text-sm font-medium">
          Anthropic APIキー
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="sk-ant-..."
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={persist}
            onChange={(e) => setPersist(e.target.checked)}
          />
          このブラウザに保存する（localStorage）
        </label>
        <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
          キーはこのブラウザから api.anthropic.com へ直接送信され、他のサーバーには送られません。
          コンソールで<b>使用上限付きのAPIキー</b>を作成して使うことを推奨します。
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            キャンセル
          </button>
          <button
            onClick={() => onSave(value.trim(), persist)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: GeneratingOverlay を実装**

`src/components/GeneratingOverlay.tsx`:

```tsx
import { useEffect, useState } from "react";

const PHASES = [
  "🏢 架空の顧客と商談中…",
  "👥 クセの強いメンバーを招集中…",
  "📋 キックオフ資料を作成中…",
  "🔥 トラブルの種を仕込み中…",
  "✨ 奇跡の展開を演出中…",
  "📊 KPIを計算中…",
  "🏁 振り返り資料を執筆中…",
];

export default function GeneratingOverlay({ progressChars }: { progressChars: number }) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setPhaseIndex((i) => (i + 1) % PHASES.length),
      4000,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/90">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      <p className="text-sm font-medium text-slate-700">{PHASES[phaseIndex]}</p>
      <p className="text-xs text-slate-400">
        {progressChars > 0 ? `${progressChars.toLocaleString()} 文字 生成済み` : "接続中…"}
      </p>
      <p className="text-xs text-slate-400">生成には1〜3分ほどかかります</p>
    </div>
  );
}
```

- [ ] **Step 4: App に統合（生成フロー含む完成形）**

`src/App.tsx` を以下の完成形に置き換え:

```tsx
import { useMemo, useState } from "react";
import type { Scenario } from "./types/scenario";
import { computeSeries } from "./lib/computeState";
import { generateScenario } from "./lib/generateScenario";
import { clearApiKey, loadApiKey, saveApiKey } from "./lib/storage";
import { SAMPLE_SCENARIOS } from "./data/samples";
import Header from "./components/Header";
import ProjectSummary from "./components/ProjectSummary";
import MemberList from "./components/MemberList";
import RelationshipMap from "./components/RelationshipMap";
import HealthCheck from "./components/HealthCheck";
import BurndownChart from "./components/BurndownChart";
import Timeline from "./components/Timeline";
import EpisodeDetail from "./components/EpisodeDetail";
import Retrospective from "./components/Retrospective";
import SettingsModal from "./components/SettingsModal";
import GeneratingOverlay from "./components/GeneratingOverlay";

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(SAMPLE_SCENARIOS[0]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [apiKey, setApiKey] = useState<string>(() => loadApiKey() ?? "");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progressChars, setProgressChars] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const series = useMemo(() => computeSeries(scenario), [scenario]);
  const snapshot = series[selectedIndex];
  const episode = scenario.episodes[selectedIndex];
  const isLastEpisode = selectedIndex === scenario.episodes.length - 1;

  function loadScenario(next: Scenario) {
    setScenario(next);
    setSelectedIndex(0);
    setError(null);
  }

  function handleSaveSettings(key: string, persist: boolean) {
    setApiKey(key);
    if (persist && key) {
      saveApiKey(key);
    } else {
      clearApiKey();
    }
    setSettingsOpen(false);
  }

  async function handleGenerate() {
    if (!apiKey || generating) return;
    setGenerating(true);
    setProgressChars(0);
    setError(null);
    try {
      const next = await generateScenario(apiKey, setProgressChars);
      loadScenario(next);
    } catch (e) {
      setError(
        e instanceof Error
          ? `生成に失敗しました: ${e.message}`
          : "生成に失敗しました。もう一度お試しください。",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onGenerate={handleGenerate}
        onSelectSample={(i) => loadScenario(SAMPLE_SCENARIOS[i])}
        generating={generating}
        hasApiKey={apiKey.length > 0}
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={handleGenerate} className="font-bold underline">
              リトライ
            </button>
          </div>
        )}
        <ProjectSummary
          scenario={scenario}
          snapshot={snapshot}
          currentPhase={episode.phase}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <MemberList members={scenario.members} />
          <RelationshipMap
            members={scenario.members}
            relationships={snapshot.relationships}
          />
          <HealthCheck series={series} selectedIndex={selectedIndex} />
        </div>
        <BurndownChart
          scenario={scenario}
          series={series}
          selectedIndex={selectedIndex}
        />
        <Timeline
          scenario={scenario}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
        <EpisodeDetail episode={episode} members={scenario.members} />
        {isLastEpisode && <Retrospective scenario={scenario} />}
      </main>
      {settingsOpen && (
        <SettingsModal
          apiKey={apiKey}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {generating && <GeneratingOverlay progressChars={progressChars} />}
    </div>
  );
}
```

- [ ] **Step 5: 目視確認とビルド**

Run: `npm run build && npm test`
Expected: ビルド成功、全テストPASS

`npm run dev` で確認:
1. 最終エピソード（リリース）を選択すると最終振り返りが出る
2. 設定モーダルでキー入力→保存チェックあり/なしの両方が動く（DevToolsでlocalStorage確認）
3. （APIキーがあれば）「新規プロジェクト生成」で生成が走り、完了後にダッシュボード全体が新シナリオに切り替わる。エラー時はトースト＋リトライが出る

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components
git commit -m "feat: 最終振り返り・設定モーダル・生成フロー統合"
```

---

### Task 13: 仕上げ（README・最終検証）

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README を更新**

`README.md` を以下に置き換え:

```markdown
# 空想プロジェクトシミュレーター

AIがゲームマスターとなり、架空のシステム開発プロジェクトを生成・進行するシミュレーションWebアプリ。
「開発現場あるある」に満ちたプロジェクトのドラマを、ダッシュボード形式で追体験できます。

## 使い方

```bash
npm install
npm run dev
```

- サンプルシナリオはAPIキーなしで閲覧できます
- 新規プロジェクトを生成するには、⚙️設定から自分の Anthropic APIキー を登録してください
  - キーはブラウザから api.anthropic.com へ直接送信されます（BYOK方式）
  - 使用上限付きのAPIキーの利用を推奨します

## 開発

```bash
npm test        # ユニットテスト
npm run build   # プロダクションビルド
```

## 設計資料

- 仕様: `docs/superpowers/specs/2026-07-09-fanciful-project-simulator-design.md`
- 実装計画: `docs/superpowers/plans/2026-07-09-fanciful-project-simulator-mvp.md`
```

- [ ] **Step 2: 全テスト・ビルドの最終確認**

Run: `npm test && npm run build`
Expected: 全テストPASS、ビルド成功

- [ ] **Step 3: 目視の総合確認**

`npm run dev` で以下を一通り確認:
- サンプル1/2の切り替え
- タイムライン操作で全ウィジェット（サマリ・関係マップ・健康診断・バーンダウン・エピソード）が連動
- 最終エピソードで振り返り表示
- モバイル幅（レスポンシブ）で崩れが致命的でないこと

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: READMEにセットアップ手順を追加"
```
