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
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-700">📅 タイムライン</h2>
        <span className="text-[11px] text-slate-400">横にスクロール →</span>
      </div>
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 pr-8">
          {scenario.episodes.map((ep, i) => {
            const selected = i === selectedIndex;
            const past = i <= selectedIndex;
            return (
              <button
                key={ep.id}
                onClick={() => onSelect(i)}
                className={`min-w-36 shrink-0 rounded-md border p-2 text-left transition ${
                  selected
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                    : past
                      ? "border-slate-300 bg-white hover:bg-slate-50"
                      : "border-slate-200 bg-slate-50 opacity-60 hover:opacity-100"
                }`}
              >
                <div className="text-[10px] font-bold text-slate-500">
                  {i + 1}. {ep.phase}
                </div>
                <div className="mt-0.5 line-clamp-2 text-xs">{ep.headline}</div>
              </button>
            );
          })}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
        />
      </div>
    </section>
  );
}
