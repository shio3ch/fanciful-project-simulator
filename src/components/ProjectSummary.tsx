import type { Scenario } from "../types/scenario";
import type { SnapshotState } from "../lib/computeState";
import { STATUS_EMOJI } from "../lib/ui";

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-card/70 px-3 py-2">
      <dt className="text-[11px] text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
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
    <section className="relative overflow-hidden rounded-2xl border border-line bg-card p-5 sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-accent-soft to-transparent"
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {scenario.project.name}
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3.5 py-1 text-sm font-bold text-accent-ink">
            {STATUS_EMOJI[snapshot.projectStatus]} {snapshot.projectStatus}
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          {scenario.project.overview}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatChip label="顧客" value={scenario.project.client} />
          <StatChip label="開発期間" value={scenario.project.period} />
          <StatChip label="予算" value={scenario.project.budget} />
          <StatChip label="難易度" value={scenario.project.difficulty} />
          <StatChip label="現在工程" value={currentPhase} />
        </dl>
      </div>
    </section>
  );
}
