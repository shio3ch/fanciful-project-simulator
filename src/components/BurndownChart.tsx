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
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-slate-700">📉 バーンダウンチャート（残タスク数）</h2>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <ReferenceLine
              x={data[selectedIndex + 1].name}
              stroke="#6366f1"
              strokeDasharray="4 4"
              label={{ value: "現在", fontSize: 10, fill: "#6366f1" }}
            />
            <Area dataKey="tasks" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
