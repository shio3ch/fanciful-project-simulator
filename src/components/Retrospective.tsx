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
