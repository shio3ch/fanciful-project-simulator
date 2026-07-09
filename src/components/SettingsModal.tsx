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
