import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KPI_KEYS, KPI_LABELS } from "../types/scenario";
import type { SnapshotState } from "../lib/computeState";

const LINE_COLORS: Record<(typeof KPI_KEYS)[number], string> = {
  morale: "#6366f1",
  quality: "#10b981",
  schedule: "#f59e0b",
  budget: "#0ea5e9",
  customerSatisfaction: "#ec4899",
};

export default function HealthCheck({
  series,
  selectedIndex,
}: {
  series: SnapshotState[];
  selectedIndex: number;
}) {
  const current = series[selectedIndex].kpi;
  const data = series.map((s, i) => ({ name: `${i + 1}`, ...s.kpi }));

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-ink-muted">
        🩺 プロジェクト健康診断
      </h2>
      <div className="space-y-1.5">
        {KPI_KEYS.map((k) => (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-ink-muted">{KPI_LABELS[k]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${current[k]}%`, backgroundColor: LINE_COLORS[k] }}
              />
            </div>
            <span className="w-8 text-right font-bold">{current[k]}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -30 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v, name) => [v, KPI_LABELS[name as (typeof KPI_KEYS)[number]]]}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--ink-muted)" }}
            />
            <ReferenceLine x={`${selectedIndex + 1}`} strokeDasharray="4 4" />
            {KPI_KEYS.map((k) => (
              <Line
                key={k}
                dataKey={k}
                stroke={LINE_COLORS[k]}
                dot={false}
                strokeWidth={1.5}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
