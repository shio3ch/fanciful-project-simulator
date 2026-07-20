import { useState } from "react";
import type { ApiProvider } from "../lib/storage";

export default function SettingsModal({
  provider,
  apiKey,
  onSave,
  onClose,
}: {
  provider: ApiProvider;
  apiKey: string;
  onSave: (provider: ApiProvider, key: string, persist: boolean) => void;
  onClose: () => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState(provider);
  const [value, setValue] = useState(apiKey);
  const [persist, setPersist] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold">⚙️ 設定</h2>
        <label className="mt-4 block text-sm font-medium">
          AIプロバイダー
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as ApiProvider)}
            className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm"
          >
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium">
          {selectedProvider === "anthropic" ? "Anthropic" : "OpenAI"} APIキー
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={selectedProvider === "anthropic" ? "sk-ant-..." : "sk-..."}
            className="mt-1 w-full rounded-md border border-line bg-card px-3 py-2 text-sm"
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
        <p className="mt-3 rounded-md bg-amber-500/10 p-2 text-xs text-amber-600">
          キーはこのブラウザから
          {selectedProvider === "anthropic" ? " api.anthropic.com " : " api.openai.com "}
          へ直接送信され、他のサーバーには送られません。
          コンソールで<b>使用上限付きのAPIキー</b>を作成して使うことを推奨します。
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-card-raised"
          >
            キャンセル
          </button>
          <button
            onClick={() => onSave(selectedProvider, value.trim(), persist)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
