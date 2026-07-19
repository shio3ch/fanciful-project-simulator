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
