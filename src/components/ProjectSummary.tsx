import type { Scenario } from "../types/scenario";
import type { SnapshotState } from "../lib/computeState";
import { STATUS_COLORS } from "../lib/ui";

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

export default function ProjectSummary({
  scenario,
  snapshot,
  currentPhase,
}: {
  scenario: Scenario;
  snapshot: SnapshotState;
  currentPhase: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-bold">{scenario.project.name}</h2>
        <span
          className={`rounded-full border px-3 py-0.5 text-xs font-bold ${STATUS_COLORS[snapshot.projectStatus]}`}
        >
          {snapshot.projectStatus}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{scenario.project.overview}</p>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Item label="顧客" value={scenario.project.client} />
        <Item label="開発期間" value={scenario.project.period} />
        <Item label="予算" value={scenario.project.budget} />
        <Item label="難易度" value={scenario.project.difficulty} />
        <Item label="現在工程" value={currentPhase} />
      </dl>
    </section>
  );
}
