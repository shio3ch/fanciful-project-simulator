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
