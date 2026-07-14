# 空想プロジェクトシミュレーター

AIがゲームマスターとなり、架空のシステム開発プロジェクトを生成・進行するシミュレーションWebアプリ。
「開発現場あるある」に満ちたプロジェクトのドラマを、ダッシュボード形式で追体験できます。

## 使い方

```bash
npm install
npm run dev
```

- サンプルシナリオはAPIキーなしで閲覧できます
- 新規プロジェクトを生成するには、⚙️設定から Anthropic または OpenAI と自分のAPIキーを登録してください
  - キーはブラウザから選択したプロバイダーのAPIへ直接送信されます（BYOK方式）
  - 使用上限付きのAPIキーの利用を推奨します

## 開発

```bash
npm test        # ユニットテスト
npm run build   # プロダクションビルド
```

## 設計資料

- 仕様: `docs/superpowers/specs/2026-07-09-fanciful-project-simulator-design.md`
- 実装計画: `docs/superpowers/plans/2026-07-09-fanciful-project-simulator-mvp.md`
