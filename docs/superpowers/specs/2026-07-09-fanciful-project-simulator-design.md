# 空想プロジェクトシミュレーター MVP 設計書

日付: 2026-07-09
ステータス: 承認済み（実装計画待ち）

## 1. 概要

AIがゲームマスターとなり、架空のシステム開発プロジェクトを生成・進行するシミュレーションWebアプリ。ユーザーはタイムラインを操作しながら、ダッシュボード形式で「開発現場のドラマ」を追体験する。

- 勝敗を競うゲームではなく「読み物 × ダッシュボード」体験
- AI = シミュレーションエンジン（JSONのみ返却）、フロントエンド = 可視化エンジン
- ログイン不要・DB不要

要件定義書（ユーザー提供）を正とし、本書は実装方針を定める。

## 2. アーキテクチャ

| 項目 | 採用技術 | 理由 |
|---|---|---|
| フレームワーク | Vite + React + TypeScript (SPA) | サーバー不要、静的ホスティング可能 |
| スタイリング | Tailwind CSS v4 | GitHub/Linear風の業務ツールUIを効率構築 |
| チャート | recharts | バーンダウン・KPI推移 |
| 関係マップ | @xyflow/react (React Flow) | カスタムノード＋関係タイプ別エッジ |
| AI呼び出し | @anthropic-ai/sdk（ブラウザ直接） | BYOK方式 |
| バリデーション | zod | シナリオJSONの検証 + structured outputs スキーマ |
| テスト | vitest | ロジックのユニットテスト |

### BYOK（Bring Your Own Key）方式

- ユーザーが設定モーダルで自分のAnthropic APIキーを入力
- localStorage への保存は**オプトイン**（保存しない選択可、その場合はメモリ保持のみ）
- SDK は `dangerouslyAllowBrowser: true` で初期化。鍵の送信先は `api.anthropic.com` のみ
- UI上で「使用上限付きAPIキーの利用を推奨」と案内
- XSS対策：外部スクリプト読み込みなし、ユーザー入力・AI出力をHTMLとして描画しない（Reactのデフォルトエスケープに任せ、`dangerouslySetInnerHTML` は使用禁止）

### 動作モード（ハイブリッド）

1. **サンプルモード（デフォルト）**: 同梱シナリオJSON（2〜3本）を即ロード。APIキー不要でフル体験可能
2. **生成モード**: APIキー設定後、「新規プロジェクト生成」でClaude APIからシナリオを生成

## 3. AI生成仕様

- モデル: `claude-opus-4-8`（デフォルト。モデル切り替えは将来拡張）
- `thinking: {type: "adaptive"}`
- **structured outputs**: `output_config.format` + `zodOutputFormat(ScenarioSchema)` でシナリオJSONスキーマを強制
- **ストリーミング必須**: シナリオJSONは長大（数万トークン想定）のため `client.messages.stream()` + `finalMessage()`。ストリーミング中は演出ローディング（「キックオフ準備中…」「メンバー招集中…」等の段階表示）
- 1リクエストでシナリオ全体（プロジェクト・メンバー・関係・全エピソード・振り返り）を生成
- プロンプトで「システム開発あるある」「ユーモア」「日本語」「エンジニアが笑える固有名詞」を指示
- エラー処理: APIエラーはトースト表示＋リトライボタン。zodバリデーション失敗時はエラー内容表示＋再生成を促す

## 4. シナリオJSONスキーマ

```typescript
Scenario {
  project: {
    name, client, overview,          // プロジェクト名・顧客・概要
    period, budget, difficulty       // 期間・予算・難易度
  }
  members: Member[]                  // 4〜6人
  Member {
    id, name, emoji,                 // 例: "Null田 Pointer介"
    role, catchphrase, personality,
    strengths, weaknesses,
    stats: { technical, communication, mental, luck },  // 0-100
    specialSkill
  }
  initialRelationships: Edge[]       // { from, to, type, score }
                                     // type: 尊敬|信頼|苦手|ライバル|仲良し
  initialKpi: { morale, quality, schedule, budget, customerSatisfaction }  // 0-100
  initialTaskCount: number           // バーンダウン初期値
  episodes: Episode[]                // 8〜12件、工程順
  Episode {
    id, phase,                       // キックオフ|要件定義|基本設計|詳細設計|開発|テスト|リリース
    headline,                        // 🔥 営業、存在しない機能を受注
    summary, story,                  // 概要2-3行 + 本文
    chatLog: { speaker, message }[], // Slack風抜粋 3〜5件
    minutes: string[],               // 議事録抜粋
    kpiDelta: { morale?, quality?, schedule?, budget?, customerSatisfaction? },
    taskDelta: number,               // 正=タスク増、負=消化
    relationshipChanges: { from, to, type, delta }[],
    tags: string[],                  // 炎上|バグ|仕様変更|顧客対応|奇跡|リリース
    projectStatus                    // 順調|少し怪しい|黄色信号|炎上中|崩壊寸前|奇跡の復活|無事リリース
  }
  retrospective: {
    summary,                         // AI総評
    mvp: { memberId, reason },
    warCriminal: { memberId, reason },  // ユーモアとして表現
    famousQuote,                     // 「動いているので仕様です。」
    lessonsLearned: string[],        // 3〜5件
    finalScores: { delivery, quality, customerSatisfaction, teamwork, flameLevel },  // 0-100
    finalComment
  }
}
```

### 差分累積方式（設計の核）

KPI・残タスク・人間関係は、AIに各時点の絶対値を出させず**初期値＋各エピソードのdelta**をフロント側で累積計算する。

- 利点: 数値の整合性が保証される（エピソードの「KPI変化 -15」表示とグラフの動きが必ず一致）
- 値は 0〜100（タスクは 0 以上）にクランプ
- 純関数 `computeStateAt(scenario, episodeIndex): SnapshotState` として実装し、vitestでテスト

## 5. 状態管理とデータフロー

グローバル状態は最小限。App直下の useState + React Context で保持する（外部状態ライブラリは使わない）:

```
{ scenario: Scenario, selectedEpisodeIndex: number, apiKey設定, 生成中フラグ }
```

**全ウィジェットは `(scenario, selectedEpisodeIndex)` の純関数**。タイムラインをクリックすると `selectedEpisodeIndex` が変わり、サマリ・健康診断・関係マップ・バーンダウン・エピソード詳細が一斉に連動して切り替わる（要件18「連動」の実現）。

- 最終エピソード選択時（＝リリース後）に「最終振り返り」セクションを表示
- バーンダウン・KPIチャートは選択時点までを実線、未来をグレー点線 or 非表示にして「進行感」を演出

## 6. コンポーネント構成

```
src/
  main.tsx / App.tsx
  types/scenario.ts          // zodスキーマ + 型（single source of truth）
  lib/
    computeState.ts          // 差分累積の純関数（テスト対象）
    generateScenario.ts      // Claude API呼び出し（stream + structured outputs）
    prompt.ts                // 生成プロンプト
    storage.ts               // APIキーのlocalStorage管理
  data/
    samples/*.json           // 同梱サンプルシナリオ
  components/
    Header.tsx               // タイトル + 生成ボタン + 設定
    ProjectSummary.tsx       // プロジェクトサマリ + 現在状態バッジ
    MemberList.tsx           // メンバーカード一覧
    RelationshipMap.tsx      // React Flow 関係マップ
    HealthCheck.tsx          // KPI健康診断（現在値 + 推移）
    BurndownChart.tsx        // recharts バーンダウン
    Timeline.tsx             // 工程タイムライン（クリックで選択）
    EpisodeDetail.tsx        // 見出し/概要/ストーリー/チャット/議事録/KPI変化/関係変化/タグ
    Retrospective.tsx        // 最終振り返り
    SettingsModal.tsx        // APIキー設定
    GeneratingOverlay.tsx    // 生成中の演出ローディング
```

## 7. UI/UX方針

- コンセプト: 「プロジェクト管理ツール × ストーリー閲覧アプリ」（GitHub / Linear / Jira / Notion 参照）
- ライト基調（GitHub風）の落ち着いた業務ツール配色。中身のユーモアとのギャップが演出
- プロジェクト状態（炎上中等）はバッジ色で表現（順調=緑 → 崩壊寸前=赤）
- チャット抜粋はSlack風の吹き出しUI
- スクリーンショット映えを意識（エピソードカードが単体で面白い見た目になること）

## 8. サンプルシナリオ

実装時にClaude（この会話）が要件のトーンで2〜3本を手書き/生成し `src/data/samples/` に同梱。zodスキーマでバリデーションが通ることをテストで保証する。

## 9. テスト戦略

- `computeState.ts`: KPI累積・クランプ・タスク推移・関係変化適用のユニットテスト
- `types/scenario.ts`: サンプルJSONがスキーマを通ることのテスト
- UIは目視確認（MVPではE2E省略）

## 10. スコープ外（将来拡張）

業界/難易度/規模選択、AIモデル切り替え、エピソード再生成、画像生成、URL共有、SNS共有、お気に入り、実プロジェクト空想化モード
