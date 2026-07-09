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
      <h2 className="mb-3 text-sm font-bold text-slate-700">📅 タイムライン</h2>
      <div className="flex gap-2 overflow-x-auto pb-2">
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
    </section>
  );
}
