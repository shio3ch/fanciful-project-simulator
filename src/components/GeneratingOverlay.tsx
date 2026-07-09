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
