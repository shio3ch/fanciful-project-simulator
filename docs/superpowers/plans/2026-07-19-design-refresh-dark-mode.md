# デザイン刷新（ドラマ演出型）+ ナイトモード 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プロジェクトステータス連動の色演出（ドラマ演出型）とライト/ダーク/システム追従のナイトモードを、CSS変数トークン基盤の上に実装する。

**Architecture:** `src/index.css` にセマンティックトークン（`--surface` `--card` `--ink` 等）とステータス連動アクセント（`--accent` 系）を定義し、Tailwind v4 の `@theme inline` でユーティリティ化。テーマは `<html data-theme>` 属性、ステータスは App ルートの `data-status` 属性で CSS 変数の値だけを切り替える。コンポーネントは `dark:` を書かずトークンユーティリティのみ使う。チャート類（recharts / xyflow）は CSS セレクタ上書きとインラインスタイルの `var()` でテーマ対応する。

**Tech Stack:** React 19, Tailwind CSS v4（`@custom-variant` / `@theme inline`）, recharts, @xyflow/react, vitest

**Spec:** `docs/superpowers/specs/2026-07-19-design-refresh-dark-mode-design.md`

## Global Constraints

- 新規ライブラリ・Webフォントの追加禁止（Tailwind v4 の機能のみ）
- コンポーネント内に `dark:` バリアントを書かない（トークンの値だけがテーマで変わる）
- 色の直書き（`bg-white` / `text-slate-900` / 16進数）は原則禁止。例外: 固定CTA（indigo）、正負色（`text-emerald-500` / `text-red-500` / amber系警告）、KPI折れ線5色（両テーマで可読なため固定）
- セクションの並び・情報構成・既存機能は変更しない
- UIコピーは日本語。テストの describe/test 名も既存流儀（日本語）に合わせる
- テストは `storage.test.ts` の流儀（`vi.stubGlobal` で localStorage スタブ）に合わせる
- テーマの localStorage キーは `fps.theme`（生文字列 `"light" | "dark" | "system"`）
- 各コミットは `git add <対象ファイル>` で対象を明示する（`git add -A` 禁止。作業ツリーに本計画と無関係の未コミット変更があるため）

### 着手前の確認（重要）

作業ツリーに OpenAI 対応関連の未コミット変更がある（`src/App.tsx`, `src/lib/generateScenario.ts`, `src/lib/prompt.ts`, `src/lib/generationError.*`, `src/lib/openaiScenario.*`）。本計画は `App.tsx` を編集するため、**開始前にこれらを別コミットとして確定させること**（コミットメッセージ例: `feature: OpenAI生成のエラーハンドリングを改善`）。未コミットのまま進めると無関係な変更が混入する。判断に迷う場合はユーザーに確認する。

## File Structure

| ファイル | 責務 |
|---|---|
| `src/index.css` | トークン定義（ライト/ダーク）、ステータス別アクセント、チャート用CSS上書き |
| `src/lib/theme.ts`（新規） | テーマ設定の型・保存/読込・巡回・解決の純粋ロジック |
| `src/lib/theme.test.ts`（新規） | 上記のユニットテスト |
| `src/lib/ui.ts` | ステータス→キー/絵文字マッピング、Δ表示ヘルパー、関係色（`var()` 化） |
| `index.html` | FOUC防止のテーマ初期化スクリプト |
| `src/App.tsx` | テーマ状態の保持とDOM適用、`data-status` 注入、エラーバナー |
| `src/components/*.tsx` | 各コンポーネントのトークン化・意匠刷新 |

---

### Task 1: デザイントークン基盤 + ステータスキー

**Files:**
- Modify: `src/index.css`
- Modify: `src/lib/ui.ts`
- Test: `src/lib/ui.test.ts`

**Interfaces:**
- Produces: `STATUS_KEYS: Record<ProjectStatus, StatusKey>`（`StatusKey = "calm" | "hazy" | "caution" | "flame" | "collapse" | "miracle" | "release"`）、`STATUS_EMOJI: Record<ProjectStatus, string>`、Tailwindユーティリティ `bg-surface` `bg-card` `bg-card-raised` `text-ink` `text-ink-muted` `border-line` `bg-accent` `bg-accent-soft` `text-accent` `text-accent-ink` `border-accent`
- Consumes: `ProjectStatus`（`src/types/scenario.ts`）

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/ui.test.ts` の import と describe 内にテストを追加:

```ts
// import 行を差し替え
import {
  STATUS_COLORS,
  STATUS_KEYS,
  STATUS_EMOJI,
  REL_COLORS,
  deltaColor,
  formatDelta,
} from "./ui";
```

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/lib/ui.test.ts`
Expected: FAIL（`STATUS_KEYS` が export されていない）

- [ ] **Step 3: ui.ts にマッピングを実装**

`src/lib/ui.ts` の `STATUS_COLORS` の直後に追加（`STATUS_COLORS` はまだ削除しない。Task 4 で削除する）:

```ts
export type StatusKey =
  | "calm"
  | "hazy"
  | "caution"
  | "flame"
  | "collapse"
  | "miracle"
  | "release";

export const STATUS_KEYS: Record<ProjectStatus, StatusKey> = {
  順調: "calm",
  少し怪しい: "hazy",
  黄色信号: "caution",
  炎上中: "flame",
  崩壊寸前: "collapse",
  奇跡の復活: "miracle",
  無事リリース: "release",
};

export const STATUS_EMOJI: Record<ProjectStatus, string> = {
  順調: "✅",
  少し怪しい: "🤔",
  黄色信号: "⚠️",
  炎上中: "🔥",
  崩壊寸前: "💀",
  奇跡の復活: "🌈",
  無事リリース: "🎉",
};
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/lib/ui.test.ts`
Expected: PASS

- [ ] **Step 5: index.css をトークン基盤に書き換える**

`src/index.css` 全体を以下に置き換え:

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

/* ---- セマンティックトークン ---- */
:root {
  color-scheme: light;
  --surface: #f6f7fb;
  --card: #ffffff;
  --card-raised: #eef1f8;
  --ink: #1e2433;
  --ink-muted: #64748b;
  --line: #e2e8f0;
  /* アクセント既定値（indigo）。data-status で上書きされる */
  --accent: #6366f1;
  --accent-soft: #eef2ff;
  --accent-ink: #4338ca;
  /* 人間関係マップの関係色 */
  --rel-respect: #0284c7;
  --rel-trust: #059669;
  --rel-awkward: #d97706;
  --rel-rival: #7c3aed;
  --rel-buddy: #db2777;
}

/* ダーク: 夜のオフィス（深いネイビー、カードがわずかに浮く） */
[data-theme="dark"] {
  color-scheme: dark;
  --surface: #0d1220;
  --card: #161d30;
  --card-raised: #1f2740;
  --ink: #e6eaf4;
  --ink-muted: #8b94ab;
  --line: #2a3352;
  --accent: #818cf8;
  --accent-soft: #272f55;
  --accent-ink: #c7d2fe;
  --rel-respect: #38bdf8;
  --rel-trust: #34d399;
  --rel-awkward: #fbbf24;
  --rel-rival: #a78bfa;
  --rel-buddy: #f472b6;
}

/* ---- ステータス連動アクセント ----
   App ルートの data-status（STATUS_KEYS の値）で差し色が切り替わる */
[data-status="calm"],
[data-status="release"] {
  --accent: #059669;
  --accent-soft: #d1fae5;
  --accent-ink: #047857;
}
[data-status="hazy"] {
  --accent: #65a30d;
  --accent-soft: #ecfccb;
  --accent-ink: #4d7c0f;
}
[data-status="caution"] {
  --accent: #d97706;
  --accent-soft: #fef3c7;
  --accent-ink: #b45309;
}
[data-status="flame"] {
  --accent: #ea580c;
  --accent-soft: #ffedd5;
  --accent-ink: #c2410c;
}
[data-status="collapse"] {
  --accent: #dc2626;
  --accent-soft: #fee2e2;
  --accent-ink: #b91c1c;
}
[data-status="miracle"] {
  --accent: #0284c7;
  --accent-soft: #e0f2fe;
  --accent-ink: #0369a1;
}

[data-theme="dark"] [data-status="calm"],
[data-theme="dark"] [data-status="release"] {
  --accent: #34d399;
  --accent-soft: #0f2e23;
  --accent-ink: #6ee7b7;
}
[data-theme="dark"] [data-status="hazy"] {
  --accent: #a3e635;
  --accent-soft: #232e12;
  --accent-ink: #bef264;
}
[data-theme="dark"] [data-status="caution"] {
  --accent: #fbbf24;
  --accent-soft: #33270d;
  --accent-ink: #fcd34d;
}
[data-theme="dark"] [data-status="flame"] {
  --accent: #fb923c;
  --accent-soft: #371a0c;
  --accent-ink: #fdba74;
}
[data-theme="dark"] [data-status="collapse"] {
  --accent: #f87171;
  --accent-soft: #380f12;
  --accent-ink: #fca5a5;
}
[data-theme="dark"] [data-status="miracle"] {
  --accent: #38bdf8;
  --accent-soft: #0c2438;
  --accent-ink: #7dd3fc;
}

/* ---- Tailwind ユーティリティへのマッピング ---- */
@theme inline {
  --color-surface: var(--surface);
  --color-card: var(--card);
  --color-card-raised: var(--card-raised);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-line: var(--line);
  --color-accent: var(--accent);
  --color-accent-soft: var(--accent-soft);
  --color-accent-ink: var(--accent-ink);
}
```

- [ ] **Step 6: ビルドとテストが通ることを確認**

Run: `npm test && npm run build`
Expected: 全テスト PASS、ビルド成功（この時点で見た目は変わらない。旧クラスは各コンポーネントのタスクで置換する）

- [ ] **Step 7: コミット**

```bash
git add src/index.css src/lib/ui.ts src/lib/ui.test.ts
git commit -m "feat: デザイントークン基盤とステータス連動アクセントを追加"
```

---

### Task 2: テーマ管理ロジック（theme.ts）+ FOUC防止

**Files:**
- Create: `src/lib/theme.ts`
- Create: `src/lib/theme.test.ts`
- Modify: `index.html`

**Interfaces:**
- Produces:
  - `type ThemePreference = "light" | "dark" | "system"`
  - `type ResolvedTheme = "light" | "dark"`
  - `loadThemePreference(): ThemePreference`
  - `saveThemePreference(pref: ThemePreference): void`
  - `nextThemePreference(pref: ThemePreference): ThemePreference`（light→dark→system→light）
  - `resolveTheme(pref: ThemePreference, systemDark: boolean): ResolvedTheme`
  - `THEME_LABELS: Record<ThemePreference, string>`

- [ ] **Step 1: 失敗するテストを書く**

`src/lib/theme.test.ts` を作成:

```ts
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  loadThemePreference,
  saveThemePreference,
  nextThemePreference,
  resolveTheme,
} from "./theme";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

describe("theme", () => {
  test("保存して読み出せる", () => {
    saveThemePreference("dark");
    expect(loadThemePreference()).toBe("dark");
  });

  test("未保存ならsystem", () => {
    expect(loadThemePreference()).toBe("system");
  });

  test("不正な保存値はsystemにフォールバック", () => {
    store.set("fps.theme", "purple");
    expect(loadThemePreference()).toBe("system");
  });

  test("light→dark→system→lightの順に巡回する", () => {
    expect(nextThemePreference("light")).toBe("dark");
    expect(nextThemePreference("dark")).toBe("system");
    expect(nextThemePreference("system")).toBe("light");
  });

  test("resolveThemeはsystemのときだけOS設定に従う", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  test("localStorageが使えない環境でも例外を出さない", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadThemePreference()).toBe("system");
    expect(() => saveThemePreference("dark")).not.toThrow();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/lib/theme.test.ts`
Expected: FAIL（`./theme` が存在しない）

- [ ] **Step 3: theme.ts を実装**

`src/lib/theme.ts` を作成:

```ts
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
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/lib/theme.test.ts`
Expected: PASS

- [ ] **Step 5: index.html にFOUC防止スクリプトを追加**

`index.html` の `<title>` 行の直後に追加（React マウント前に `data-theme` を確定させる。キー名 `fps.theme`・値の意味は `theme.ts` と一致させること）:

```html
    <script>
      (function () {
        try {
          var pref = localStorage.getItem("fps.theme");
          var dark =
            pref === "dark" ||
            ((pref === null || pref === "system") &&
              window.matchMedia("(prefers-color-scheme: dark)").matches);
          if (dark) document.documentElement.dataset.theme = "dark";
        } catch (e) {}
      })();
    </script>
```

- [ ] **Step 6: 全テストとビルドを確認**

Run: `npm test && npm run build`
Expected: PASS / 成功

- [ ] **Step 7: コミット**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts index.html
git commit -m "feat: テーマ設定ロジックとFOUC防止スクリプトを追加"
```

---

### Task 3: テーマ切替UI（Header）+ Appのテーマ適用

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 2 の `theme.ts` 全API
- Produces: `Header` の新props `themePref: ThemePreference` / `onCycleTheme: () => void`

- [ ] **Step 1: Header.tsx を書き換える**

`src/components/Header.tsx` 全体を以下に置き換え（テーマボタン追加 + トークン化 + すりガラス化）:

```tsx
import { THEME_LABELS, type ThemePreference } from "../lib/theme";

const THEME_ICONS: Record<ThemePreference, string> = {
  light: "☀️",
  dark: "🌙",
  system: "💻",
};

export default function Header({
  onOpenSettings,
  onGenerate,
  onSelectSample,
  generating,
  hasApiKey,
  themePref,
  onCycleTheme,
}: {
  onOpenSettings: () => void;
  onGenerate: () => void;
  onSelectSample: (index: number) => void;
  generating: boolean;
  hasApiKey: boolean;
  themePref: ThemePreference;
  onCycleTheme: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-line bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
      <h1 className="w-full text-lg font-bold tracking-tight sm:w-auto">
        🎭 空想プロジェクトシミュレーター
      </h1>
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:ml-auto sm:flex sm:w-auto">
        <select
          className="col-span-3 min-w-0 rounded-md border border-line bg-card px-2 py-1.5 text-sm sm:col-span-1 sm:w-auto"
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
          className="whitespace-nowrap rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
        >
          {generating ? "生成中…" : "✨ 新規プロジェクト生成"}
        </button>
        <button
          onClick={onOpenSettings}
          className="whitespace-nowrap rounded-md border border-line px-3 py-1.5 text-sm hover:bg-card-raised"
        >
          ⚙️ 設定
        </button>
        <button
          onClick={onCycleTheme}
          title={`テーマ: ${THEME_LABELS[themePref]}（クリックで切替）`}
          aria-label={`テーマ切替（現在: ${THEME_LABELS[themePref]}）`}
          className="whitespace-nowrap rounded-md border border-line px-2.5 py-1.5 text-sm hover:bg-card-raised"
        >
          {THEME_ICONS[themePref]}
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: App.tsx にテーマ状態とDOM適用を追加**

`src/App.tsx` を編集。

(a) import を追加・変更:

```tsx
import { useEffect, useMemo, useState } from "react";
import {
  loadThemePreference,
  nextThemePreference,
  resolveTheme,
  saveThemePreference,
  type ThemePreference,
} from "./lib/theme";
```

(b) `const [error, setError] = ...` の直後に state と effect を追加:

```tsx
  const [themePref, setThemePref] = useState<ThemePreference>(() =>
    loadThemePreference(),
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(
        themePref,
        media.matches,
      );
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [themePref]);

  function handleCycleTheme() {
    const next = nextThemePreference(themePref);
    setThemePref(next);
    saveThemePreference(next);
  }
```

(c) `<Header ... />` に props を追加:

```tsx
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onGenerate={handleGenerate}
        onSelectSample={(i) => loadScenario(SAMPLE_SCENARIOS[i])}
        generating={generating}
        hasApiKey={apiSettings.apiKey.length > 0}
        themePref={themePref}
        onCycleTheme={handleCycleTheme}
      />
```

(d) ルート div をトークン化:

```tsx
    <div className="min-h-screen bg-surface text-ink">
```

- [ ] **Step 3: 検証**

Run: `npm test && npm run build`
Expected: PASS / 成功

Run: `npm run dev` → ブラウザで確認:
- ヘッダー右端のテーマボタンが ☀️ → 🌙 → 💻 と巡回する
- 🌙 でページ全体が「夜のオフィス」トーン（深いネイビー）に変わる
- リロードしても選択が保持され、白いチラつき（FOUC）が出ない
- 💻 のとき OS のダークモード設定に追従する

- [ ] **Step 4: コミット**

```bash
git add src/components/Header.tsx src/App.tsx
git commit -m "feat: ナイトモード切替（ライト/ダーク/システム追従）を追加"
```

---

### Task 4: ProjectSummary のヒーロー化 + data-status 注入

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ProjectSummary.tsx`
- Modify: `src/lib/ui.ts`（`STATUS_COLORS` 削除）
- Test: `src/lib/ui.test.ts`（`STATUS_COLORS` テスト削除）

**Interfaces:**
- Consumes: `STATUS_KEYS` / `STATUS_EMOJI`（Task 1）、`--accent` 系トークン（Task 1）
- Produces: App ルート div の `data-status` 属性（配下全体のアクセント色が確定する）

- [ ] **Step 1: App.tsx のルート div に data-status を付与**

`src/App.tsx` の import に追加:

```tsx
import { STATUS_KEYS } from "./lib/ui";
```

ルート div を変更:

```tsx
    <div
      className="min-h-screen bg-surface text-ink"
      data-status={STATUS_KEYS[snapshot.projectStatus]}
    >
```

- [ ] **Step 2: ProjectSummary.tsx を書き換える**

`src/components/ProjectSummary.tsx` 全体を以下に置き換え:

```tsx
import type { Scenario } from "../types/scenario";
import type { SnapshotState } from "../lib/computeState";
import { STATUS_EMOJI } from "../lib/ui";

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-card/70 px-3 py-2">
      <dt className="text-[11px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
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
    <section className="relative overflow-hidden rounded-2xl border border-line bg-card p-5 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-accent-soft to-transparent"
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {scenario.project.name}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3.5 py-1 text-sm font-bold text-accent-ink">
            {STATUS_EMOJI[snapshot.projectStatus]} {snapshot.projectStatus}
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          {scenario.project.overview}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatChip label="顧客" value={scenario.project.client} />
          <StatChip label="開発期間" value={scenario.project.period} />
          <StatChip label="予算" value={scenario.project.budget} />
          <StatChip label="難易度" value={scenario.project.difficulty} />
          <StatChip label="現在工程" value={currentPhase} />
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: STATUS_COLORS を削除**

- `src/lib/ui.ts` から `STATUS_COLORS` の定義を削除
- `src/lib/ui.test.ts` から `STATUS_COLORS` の import と「全projectStatusに配色がある」テストを削除

- [ ] **Step 4: 検証**

Run: `npm test && npm run build`
Expected: PASS / 成功（`STATUS_COLORS` の参照が残っていればビルドが落ちるので検知できる）

Run: `npm run dev` → 確認:
- プロジェクト名が大見出しになり、ステータスバッジが絵文字付きで目立つ
- タイムラインの章を進めてステータスが変わると、ヒーロー上部のグラデーションとバッジの色が変わる（サンプル1で炎上系ステータスまで進めると赤みが差す）
- ライト/ダーク両方で可読

- [ ] **Step 5: コミット**

```bash
git add src/App.tsx src/components/ProjectSummary.tsx src/lib/ui.ts src/lib/ui.test.ts
git commit -m "feat: プロジェクトサマリーをステータス連動のヒーローセクションに刷新"
```

---

### Task 5: タイムラインの章仕立て化

**Files:**
- Modify: `src/components/Timeline.tsx`

**Interfaces:**
- Consumes: `--accent` 系トークン（現在章のハイライト）
- Produces: なし（props 変更なし）

- [ ] **Step 1: Timeline.tsx を書き換える**

`src/components/Timeline.tsx` 全体を以下に置き換え（枠カードを外し全幅の帯に。章表記 + 進行ライン接続）:

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
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h2 className="text-sm font-bold text-ink-muted">📖 ストーリー</h2>
        <span className="text-[11px] text-ink-muted">横にスクロール →</span>
      </div>
      <div className="relative">
        <div className="flex items-stretch overflow-x-auto pb-2 pr-8">
          {scenario.episodes.map((ep, i) => {
            const selected = i === selectedIndex;
            const past = i < selectedIndex;
            return (
              <div key={ep.id} className="flex shrink-0 items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 w-4 shrink-0 sm:w-6 ${
                      past || selected ? "bg-accent" : "bg-line"
                    }`}
                  />
                )}
                <button
                  onClick={() => onSelect(i)}
                  className={`min-w-36 rounded-lg border p-2.5 text-left transition ${
                    selected
                      ? "border-accent bg-accent-soft ring-2 ring-accent/30"
                      : past
                        ? "border-line bg-card hover:bg-card-raised"
                        : "border-line bg-card opacity-50 hover:opacity-90"
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold ${
                      selected ? "text-accent-ink" : "text-ink-muted"
                    }`}
                  >
                    第{i + 1}章・{ep.phase}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs">{ep.headline}</div>
                </button>
              </div>
            );
          })}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent"
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 検証**

Run: `npm test && npm run build`
Expected: PASS / 成功

Run: `npm run dev` → 確認:
- 「第n章・工程名」表記で、通過済みの章がアクセント色のラインで接続される
- 現在章がアクセント色ハイライト、未来章は淡く表示
- 右端のスクロールフェードが背景色（ライト/ダーク両方）と馴染む

- [ ] **Step 3: コミット**

```bash
git add src/components/Timeline.tsx
git commit -m "feat: タイムラインを章仕立てのストーリー帯に刷新"
```

---

### Task 6: メンバーカードのゲーム風味化

**Files:**
- Modify: `src/components/MemberList.tsx`

**Interfaces:**
- Consumes: `--accent` 系トークン（アバター背景・ステータスバー・スキルチップ）
- Produces: なし（props 変更なし）

- [ ] **Step 1: MemberList.tsx を書き換える**

`src/components/MemberList.tsx` 全体を以下に置き換え:

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
    <div className="rounded-xl border border-line bg-card-raised/50 p-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl">
          {member.emoji}
        </span>
        <div>
          <div className="text-sm font-bold">{member.name}</div>
          <div className="text-xs text-ink-muted">{member.role}</div>
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed italic text-ink-muted">
        「{member.catchphrase}」
      </p>
      <dl className="mt-2 space-y-1 text-[13px] leading-relaxed text-ink-muted">
        <div>
          <dt className="inline font-medium">性格: </dt>
          <dd className="inline">{member.personality}</dd>
        </div>
        <div>
          <dt className="inline font-medium">得意: </dt>
          <dd className="inline">{member.strengths}</dd>
        </div>
        <div>
          <dt className="inline font-medium">苦手: </dt>
          <dd className="inline">{member.weaknesses}</dd>
        </div>
        <div className="rounded-md bg-accent-soft px-2 py-1 font-medium text-accent-ink">
          ✨ {member.specialSkill}
        </div>
      </dl>
      <div className="mt-2 space-y-1">
        {STAT_LABELS.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-[10px]">
            <span className="w-12 text-ink-muted">{label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent"
                style={{ width: `${member.stats[key]}%` }}
              />
            </div>
            <span className="w-6 text-right text-ink-muted">
              {member.stats[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemberList({ members }: { members: Member[] }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-ink-muted">👥 メンバー</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <MemberCard key={m.id} member={m} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 検証**

Run: `npm test && npm run build`
Expected: PASS / 成功

Run: `npm run dev` → 確認: アバターが円形バッジ化、ステータスバーがアクセントのグラデーション、スキルチップが強調表示。ライト/ダーク両方確認。

- [ ] **Step 3: コミット**

```bash
git add src/components/MemberList.tsx
git commit -m "feat: メンバーカードをゲーム風の意匠に刷新"
```

---

### Task 7: エピソード詳細の読み物化 + Δ表示ヘルパー

**Files:**
- Modify: `src/components/EpisodeDetail.tsx`
- Modify: `src/lib/ui.ts`
- Test: `src/lib/ui.test.ts`

**Interfaces:**
- Produces: `deltaArrow(v: number): string`（▲ / ▼ / —）
- Consumes: `deltaColor` / `formatDelta`（既存）、トークンユーティリティ

- [ ] **Step 1: deltaArrow の失敗するテストを書く**

`src/lib/ui.test.ts` の import に `deltaArrow` を追加し、describe 内に追加:

```ts
  test("deltaArrow は正負で矢印が変わる", () => {
    expect(deltaArrow(5)).toBe("▲");
    expect(deltaArrow(-5)).toBe("▼");
    expect(deltaArrow(0)).toBe("—");
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- src/lib/ui.test.ts`
Expected: FAIL（`deltaArrow` が export されていない）

- [ ] **Step 3: ui.ts に deltaArrow を実装し、deltaColor を両テーマ対応の色に更新**

`src/lib/ui.ts` の `deltaColor` を差し替え、`deltaArrow` を追加:

```ts
export function deltaColor(v: number): string {
  if (v > 0) return "text-emerald-500";
  if (v < 0) return "text-red-500";
  return "text-ink-muted";
}

export function deltaArrow(v: number): string {
  if (v > 0) return "▲";
  if (v < 0) return "▼";
  return "—";
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- src/lib/ui.test.ts`
Expected: PASS

- [ ] **Step 5: EpisodeDetail.tsx を書き換える**

`src/components/EpisodeDetail.tsx` 全体を以下に置き換え:

```tsx
import { KPI_KEYS, KPI_LABELS, type Episode, type Member } from "../types/scenario";
import { deltaArrow, deltaColor, formatDelta } from "../lib/ui";

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
    <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          {episode.headline}
        </h2>
        {episode.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-card-raised px-2.5 py-0.5 text-xs text-ink-muted"
          >
            #{t}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-ink-muted">{episode.summary}</p>
      <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7">
        {episode.story}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold text-ink-muted">💬 チャット抜粋</h3>
          <div className="mt-2 space-y-2 rounded-xl bg-card-raised/60 p-3">
            {episode.chatLog.map((c, i) => (
              <div key={i} className="text-sm">
                <span className="text-xs font-bold text-ink-muted">
                  {c.speaker}
                </span>
                <p className="mt-0.5 rounded-2xl rounded-tl-sm border border-line bg-card px-3 py-2 shadow-sm">
                  {c.message}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-ink-muted">📝 議事録抜粋</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {episode.minutes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-ink-muted">📊 KPI変化</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {KPI_KEYS.filter((k) => episode.kpiDelta[k] !== undefined).map(
                (k) => (
                  <span
                    key={k}
                    className={`rounded-md bg-card-raised px-2 py-1 text-sm font-bold ${deltaColor(episode.kpiDelta[k]!)}`}
                  >
                    {KPI_LABELS[k]} {deltaArrow(episode.kpiDelta[k]!)}
                    {formatDelta(episode.kpiDelta[k]!)}
                  </span>
                ),
              )}
              <span
                className={`rounded-md bg-card-raised px-2 py-1 text-sm font-bold ${deltaColor(-episode.taskDelta)}`}
              >
                残タスク {deltaArrow(episode.taskDelta)}
                {formatDelta(episode.taskDelta)}
              </span>
            </div>
          </div>
          {episode.relationshipChanges.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-ink-muted">
                🤝 人間関係の変化
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {episode.relationshipChanges.map((c, i) => (
                  <li key={i}>
                    {nameOf(c.from)} → {nameOf(c.to)}（{c.type}{" "}
                    <span className={deltaColor(c.delta)}>
                      {formatDelta(c.delta)}
                    </span>
                    ）
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

- [ ] **Step 6: 検証**

Run: `npm test && npm run build`
Expected: PASS / 成功

Run: `npm run dev` → 確認: 見出しが大きく、チャットが吹き出し風、KPI変化が ▲▼ 付きチップ。ライト/ダーク両方確認。

- [ ] **Step 7: コミット**

```bash
git add src/lib/ui.ts src/lib/ui.test.ts src/components/EpisodeDetail.tsx
git commit -m "feat: エピソード詳細を読み物風に刷新しKPI変化をチップ表示に"
```

---

### Task 8: チャートのテーマ対応（HealthCheck + BurndownChart）

**Files:**
- Modify: `src/index.css`（recharts 上書きCSS追加）
- Modify: `src/components/HealthCheck.tsx`
- Modify: `src/components/BurndownChart.tsx`

**Interfaces:**
- Consumes: 生CSS変数 `var(--ink-muted)` `var(--card)` `var(--line)` `var(--accent)` `var(--accent-soft)`
- 方針: SVG属性は `var()` 非対応のため、recharts の軸文字・基準線・エリア塗りは **CSSセレクタ上書き**（CSSは presentation attribute より優先される）。ツールチップはインラインstyleなので `var()` が使える

- [ ] **Step 1: index.css に recharts 上書きを追加**

`src/index.css` の末尾に追加:

```css
/* ---- recharts のテーマ対応 ----
   SVG presentation attribute は var() 非対応のため CSS で上書きする */
.recharts-cartesian-axis-tick text {
  fill: var(--ink-muted);
}
.recharts-reference-line line {
  stroke: var(--accent);
}
.recharts-reference-line text {
  fill: var(--accent);
}
.recharts-area-curve {
  stroke: var(--accent);
}
.recharts-area-area {
  fill: var(--accent-soft);
}
.recharts-tooltip-cursor {
  stroke: var(--line);
}
```

- [ ] **Step 2: HealthCheck.tsx を更新**

`src/components/HealthCheck.tsx` を編集。KPI折れ線5色は固定のまま（両テーマで可読）。

(a) section と見出し・バーをトークン化（return 部分を差し替え）:

```tsx
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-ink-muted">
        🩺 プロジェクト健康診断
      </h2>
      <div className="space-y-1.5">
        {KPI_KEYS.map((k) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-ink-muted">{KPI_LABELS[k]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${current[k]}%`, backgroundColor: LINE_COLORS[k] }}
              />
            </div>
            <span className="w-8 text-right font-bold">{current[k]}</span>
          </div>
        ))}
      </div>
```

(b) `<Tooltip>` にテーマ対応スタイルを追加し、`<ReferenceLine>` の `stroke` 指定を削除（CSSがアクセント色を適用する）:

```tsx
            <Tooltip
              formatter={(v, name) => [v, KPI_LABELS[name as (typeof KPI_KEYS)[number]]]}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--ink-muted)" }}
            />
            <ReferenceLine x={`${selectedIndex + 1}`} strokeDasharray="4 4" />
```

- [ ] **Step 3: BurndownChart.tsx を更新**

`src/components/BurndownChart.tsx` の return 部分を差し替え（16進数を排し、線・塗り・基準線はCSS任せに）:

```tsx
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-ink-muted">
        📉 バーンダウンチャート（残タスク数）
      </h2>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--ink-muted)" }}
            />
            <ReferenceLine
              x={data[selectedIndex + 1].name}
              strokeDasharray="4 4"
              label={{ value: "現在", fontSize: 10 }}
            />
            <Area dataKey="tasks" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
```

- [ ] **Step 4: 検証**

Run: `npm test && npm run build`
Expected: PASS / 成功

Run: `npm run dev` → 確認:
- ダークで軸ラベル・ツールチップが読める
- 両チャートの「現在」基準線とバーンダウンの面がステータスのアクセント色に連動する（章を進めて色が変わることを確認）

- [ ] **Step 5: コミット**

```bash
git add src/index.css src/components/HealthCheck.tsx src/components/BurndownChart.tsx
git commit -m "feat: チャートをテーマ対応しステータス連動のアクセント色を適用"
```

---

### Task 9: 人間関係マップのテーマ対応

**Files:**
- Modify: `src/lib/ui.ts`（`REL_COLORS` を `var()` 化）
- Modify: `src/index.css`（xyflow 背景ドットの上書き）
- Modify: `src/components/RelationshipMap.tsx`

**Interfaces:**
- Consumes: `--rel-*` 変数（Task 1 で定義済み。ライト/ダーク両対応）
- Produces: `REL_COLORS` の値が `var(--rel-*)` になる（型 `Record<RelationType, string>` は不変。インラインstyle専用となり、SVG属性への直接指定には使えない）

- [ ] **Step 1: REL_COLORS を var() 参照に変更**

`src/lib/ui.ts` の `REL_COLORS` を差し替え:

```ts
export const REL_COLORS: Record<RelationType, string> = {
  尊敬: "var(--rel-respect)",
  信頼: "var(--rel-trust)",
  苦手: "var(--rel-awkward)",
  ライバル: "var(--rel-rival)",
  仲良し: "var(--rel-buddy)",
};
```

Run: `npm test -- src/lib/ui.test.ts`
Expected: PASS（「全relationTypeに配色がある」は truthy 判定なのでそのまま通る）

- [ ] **Step 2: index.css に xyflow 上書きを追加**

`src/index.css` の末尾に追加:

```css
/* ---- xyflow のテーマ対応 ---- */
.react-flow__background circle {
  fill: var(--line);
}
```

- [ ] **Step 3: RelationshipMap.tsx のノード/エッジをトークン化**

`src/components/RelationshipMap.tsx` を編集。

(a) `buildNodes` の style をトークン化:

```tsx
      style: {
        fontSize: 10,
        padding: "4px 6px",
        borderRadius: 8,
        border: "1px solid var(--line)",
        background: "var(--card)",
        color: "var(--ink)",
        width: "auto",
      },
```

(b) `buildEdges` にラベル背景のテーマ対応を追加:

```tsx
function buildEdges(relationships: Relationship[]): Edge[] {
  return relationships.map((rel, i) => ({
    id: `rel-${i}`,
    source: rel.from,
    target: rel.to,
    label: `${rel.type} ${rel.score}`,
    labelStyle: { fontSize: 9, fill: REL_COLORS[rel.type] },
    labelBgStyle: { fill: "var(--card)", fillOpacity: 0.9 },
    style: {
      stroke: REL_COLORS[rel.type],
      strokeWidth: Math.max(1, rel.score / 30),
      opacity: 0.8,
    },
    animated: rel.score < 30,
  }));
}
```

(c) section・見出し・凡例をトークン化:

```tsx
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-ink-muted">🕸️ 人間関係マップ</h2>
```

凡例部分:

```tsx
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-ink-muted">
        {Object.entries(REL_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-4 rounded"
              style={{ backgroundColor: color }}
            />
            {type}
          </span>
        ))}
      </div>
```

- [ ] **Step 4: 検証**

Run: `npm test && npm run build`
Expected: PASS / 成功

Run: `npm run dev` → 確認: ダークでノード・エッジ・ラベル・凡例・背景ドットが読める。エッジ色が関係タイプごとに区別できる。

- [ ] **Step 5: コミット**

```bash
git add src/lib/ui.ts src/index.css src/components/RelationshipMap.tsx
git commit -m "feat: 人間関係マップをテーマ対応に"
```

---

### Task 10: 残りコンポーネントのトークン化（Retrospective / SettingsModal / GeneratingOverlay / エラーバナー）

**Files:**
- Modify: `src/components/Retrospective.tsx`
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/components/GeneratingOverlay.tsx`
- Modify: `src/App.tsx`(エラーバナー)

**Interfaces:**
- Consumes: トークンユーティリティ一式
- Produces: なし(props 変更なし)

- [ ] **Step 1: Retrospective.tsx を書き換える**

`src/components/Retrospective.tsx` 全体を以下に置き換え:

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
    <section className="rounded-2xl border-2 border-accent/40 bg-card p-5 sm:p-6">
      <h2 className="text-xl font-bold tracking-tight">🏁 最終振り返り</h2>
      <p className="mt-2 text-sm leading-relaxed">{r.summary}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-amber-500/10 p-3">
          <h3 className="text-xs font-bold text-amber-600">🏆 MVP</h3>
          <div className="mt-1 text-sm font-bold">
            {emojiOf(r.mvp.memberId)} {nameOf(r.mvp.memberId)}
          </div>
          <p className="mt-1 text-xs text-ink-muted">{r.mvp.reason}</p>
        </div>
        <div className="rounded-xl bg-card-raised p-3">
          <h3 className="text-xs font-bold text-ink-muted">💀 戦犯（愛を込めて）</h3>
          <div className="mt-1 text-sm font-bold">
            {emojiOf(r.warCriminal.memberId)} {nameOf(r.warCriminal.memberId)}
          </div>
          <p className="mt-1 text-xs text-ink-muted">{r.warCriminal.reason}</p>
        </div>
      </div>

      <blockquote className="mt-4 border-l-4 border-accent pl-4 text-base font-bold italic">
        「{r.famousQuote}」
      </blockquote>

      <div className="mt-4">
        <h3 className="text-xs font-bold text-ink-muted">📚 Lessons Learned</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {r.lessonsLearned.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-bold text-ink-muted">🎯 最終評価</h3>
        <div className="mt-2 space-y-1.5">
          {SCORE_LABELS.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-ink-muted">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/60">
                <div
                  className={`h-full rounded-full ${
                    key === "flameLevel"
                      ? "bg-red-500"
                      : "bg-gradient-to-r from-accent/60 to-accent"
                  }`}
                  style={{ width: `${r.finalScores[key]}%` }}
                />
              </div>
              <span className="w-8 text-right font-bold">
                {r.finalScores[key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
        {r.finalComment}
      </p>
    </section>
  );
}
```

- [ ] **Step 2: SettingsModal.tsx をトークン化**

`src/components/SettingsModal.tsx` の JSX のクラスのみ差し替え（state・ハンドラは不変）:

- オーバーレイ: `className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"`
- パネル: `className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-xl"`
- select: `className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm"`
- input: `className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm"`
- 注意書き: `className="mt-3 rounded-md bg-amber-500/10 p-2 text-xs text-amber-600"`
- キャンセル: `className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-card-raised"`
- 保存: `className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"`

- [ ] **Step 3: GeneratingOverlay.tsx をトークン化**

`src/components/GeneratingOverlay.tsx` の return を差し替え:

```tsx
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface/90">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      <p className="text-sm font-medium">{PHASES[phaseIndex]}</p>
      <p className="text-xs text-ink-muted">
        {progressChars > 0
          ? `${progressChars.toLocaleString()} 文字 生成済み`
          : "接続中…"}
      </p>
      <p className="text-xs text-ink-muted">生成には1〜3分ほどかかります</p>
    </div>
```

- [ ] **Step 4: App.tsx のエラーバナーをトークン化**

`src/App.tsx` のエラーバナーの外側 div のクラスを差し替え:

```tsx
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
```

- [ ] **Step 5: 検証**

Run: `npm test && npm run build`
Expected: PASS / 成功

Run: `npm run dev` → 確認:
- 最終章まで進めて最終振り返りの表示（両テーマ）
- ⚙️設定モーダルの表示（両テーマ）
- APIキー未設定のまま不正キーで生成を試みてエラーバナー表示（またはコードレビューで確認）

- [ ] **Step 6: コミット**

```bash
git add src/components/Retrospective.tsx src/components/SettingsModal.tsx src/components/GeneratingOverlay.tsx src/App.tsx
git commit -m "feat: 振り返り・設定・生成オーバーレイをテーマ対応に"
```

---

### Task 11: 最終検証

**Files:** なし（検証のみ。修正が出た場合は該当ファイル）

- [ ] **Step 1: 静的検証**

Run: `npm test && npm run lint && npm run build`
Expected: 全て成功

- [ ] **Step 2: 色直書きの残骸チェック**

Run: `grep -rn "slate-" src/components src/App.tsx; grep -rn "bg-white\|text-white" src/components src/App.tsx`
Expected: `slate-` はゼロ。`text-white` は CTA ボタン（Header の生成ボタン、SettingsModal の保存ボタン）のみ

- [ ] **Step 3: ブラウザで総合確認（`npm run dev`）**

以下を確認し、問題があれば修正して都度コミット:

1. **ライト/ダーク切替**: ☀️→🌙→💻 巡回、リロード後の保持、FOUCなし、💻でOS追従
2. **ステータス連動**: サンプル1・2それぞれで第1章→最終章まで進め、ヒーロー・バッジ・タイムライン・チャート基準線・バーンダウン面の色が変わる
3. **全セクションの可読性**（両テーマ）: メンバー、相関図、健康診断、バーンダウン、エピソード詳細、最終振り返り、設定モーダル
4. **レスポンシブ**: ウィンドウを狭めてヘッダー・スタットチップ・タイムラインが崩れない

- [ ] **Step 4: 完了報告**

superpowers:verification-before-completion に従い、検証結果（実行したコマンドと出力）を添えて完了を報告する。
