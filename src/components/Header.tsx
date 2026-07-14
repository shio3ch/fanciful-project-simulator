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
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <h1 className="w-full text-lg font-bold tracking-tight sm:w-auto">
        🎭 空想プロジェクトシミュレーター
      </h1>
      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:ml-auto sm:flex sm:w-auto">
        <select
          className="col-span-2 min-w-0 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm sm:col-span-1 sm:w-auto"
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
          className="whitespace-nowrap rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {generating ? "生成中…" : "✨ 新規プロジェクト生成"}
        </button>
        <button
          onClick={onOpenSettings}
          className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          ⚙️ 設定
        </button>
      </div>
    </header>
  );
}
