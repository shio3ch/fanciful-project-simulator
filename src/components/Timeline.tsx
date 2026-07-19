import type { Scenario } from "../types/scenario";

export default function Timeline({
  scenario,
  selectedIndex,
  onSelect,
}: {
  scenario: Scenario;
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h2 className="text-sm font-bold text-ink-muted">📖 ストーリー</h2>
        <span className="text-[11px] text-ink-muted">横にスクロール →</span>
      </div>
      <div className="relative">
        <div className="flex items-stretch overflow-x-auto pb-2 pr-8">
          {scenario.episodes.map((ep, i) => {
            const selected = i === selectedIndex;
            const past = i < selectedIndex;
            return (
              <div key={ep.id} className="flex shrink-0 items-center">
                {i > 0 && (
                  <div
                    className={`h-0.5 w-4 shrink-0 sm:w-6 ${
                      past || selected ? "bg-accent" : "bg-line"
                    }`}
                  />
                )}
                <button
                  onClick={() => onSelect(i)}
                  className={`min-w-36 rounded-lg border p-2.5 text-left transition ${
                    selected
                      ? "border-accent bg-accent-soft ring-2 ring-accent/30"
                      : past
                        ? "border-line bg-card hover:bg-card-raised"
                        : "border-line bg-card opacity-50 hover:opacity-90"
                  }`}
                >
                  <div
                    className={`text-[10px] font-bold ${
                      selected ? "text-accent-ink" : "text-ink-muted"
                    }`}
                  >
                    第{i + 1}章・{ep.phase}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs">{ep.headline}</div>
                </button>
              </div>
            );
          })}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-surface to-transparent"
        />
      </div>
    </section>
  );
}
