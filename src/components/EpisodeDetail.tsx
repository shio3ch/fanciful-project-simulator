import { KPI_KEYS, KPI_LABELS, type Episode, type Member } from "../types/scenario";
import { deltaColor, formatDelta } from "../lib/ui";

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
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">{episode.headline}</h2>
        {episode.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
          >
            #{t}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-600">{episode.summary}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{episode.story}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold text-slate-500">💬 チャット抜粋</h3>
          <div className="mt-2 space-y-2 rounded-md bg-slate-50 p-3">
            {episode.chatLog.map((c, i) => (
              <div key={i} className="text-sm">
                <span className="font-bold text-slate-700">{c.speaker}</span>
                <p className="mt-0.5 rounded-md bg-white px-3 py-1.5 shadow-sm">
                  {c.message}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500">📝 議事録抜粋</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {episode.minutes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500">📊 KPI変化</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {KPI_KEYS.filter((k) => episode.kpiDelta[k] !== undefined).map((k) => (
                <span key={k} className={`text-sm font-bold ${deltaColor(episode.kpiDelta[k]!)}`}>
                  {KPI_LABELS[k]} {formatDelta(episode.kpiDelta[k]!)}
                </span>
              ))}
              <span className={`text-sm font-bold ${deltaColor(-episode.taskDelta)}`}>
                残タスク {formatDelta(episode.taskDelta)}
              </span>
            </div>
          </div>
          {episode.relationshipChanges.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500">🤝 人間関係の変化</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {episode.relationshipChanges.map((c, i) => (
                  <li key={i}>
                    {nameOf(c.from)} → {nameOf(c.to)}（{c.type}{" "}
                    <span className={deltaColor(c.delta)}>{formatDelta(c.delta)}</span>）
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
