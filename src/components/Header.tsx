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
