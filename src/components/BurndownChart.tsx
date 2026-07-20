import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Scenario } from "../types/scenario";
import type { SnapshotState } from "../lib/computeState";

export default function BurndownChart({
  scenario,
  series,
  selectedIndex,
}: {
  scenario: Scenario;
  series: SnapshotState[];
  selectedIndex: number;
}) {
  const data = [
    { name: "開始", tasks: scenario.initialTaskCount },
    ...series.map((s, i) => ({
      name: `${i + 1}. ${scenario.episodes[i].phase}`,
      tasks: s.taskCount,
    })),
  ];

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <h2 className="mb-3 text-sm font-bold text-ink-muted">
        📉 バーンダウンチャート（残タスク数）
      </h2>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--ink-muted)" }}
            />
            <ReferenceLine
              x={data[selectedIndex + 1].name}
              strokeDasharray="4 4"
              label={{ value: "現在", fontSize: 10 }}
            />
            <Area dataKey="tasks" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
