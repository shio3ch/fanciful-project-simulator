import { useMemo, useState } from "react";
import type { Scenario } from "./types/scenario";
import { computeSeries } from "./lib/computeState";
import { loadApiKey } from "./lib/storage";
import { SAMPLE_SCENARIOS } from "./data/samples";
import Header from "./components/Header";
import ProjectSummary from "./components/ProjectSummary";
import Timeline from "./components/Timeline";
import EpisodeDetail from "./components/EpisodeDetail";
import MemberList from "./components/MemberList";
import HealthCheck from "./components/HealthCheck";
import BurndownChart from "./components/BurndownChart";
import RelationshipMap from "./components/RelationshipMap";

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(SAMPLE_SCENARIOS[0]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [apiKey] = useState<string>(() => loadApiKey() ?? "");
  const [error, setError] = useState<string | null>(null);

  const series = useMemo(() => computeSeries(scenario), [scenario]);
  const snapshot = series[selectedIndex];
  const episode = scenario.episodes[selectedIndex];

  function loadScenario(next: Scenario) {
    setScenario(next);
    setSelectedIndex(0);
    setError(null);
  }

  function handleGenerate() {
    // Task 12 で実装
  }

  function handleOpenSettings() {
    // Task 12 で設定モーダルを実装
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        onOpenSettings={handleOpenSettings}
        onGenerate={handleGenerate}
        onSelectSample={(i) => loadScenario(SAMPLE_SCENARIOS[i])}
        generating={false}
        hasApiKey={apiKey.length > 0}
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <ProjectSummary
          scenario={scenario}
          snapshot={snapshot}
          currentPhase={episode.phase}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <MemberList members={scenario.members} />
          <RelationshipMap members={scenario.members} relationships={snapshot.relationships} />
          <HealthCheck series={series} selectedIndex={selectedIndex} />
        </div>
        <BurndownChart scenario={scenario} series={series} selectedIndex={selectedIndex} />
        <Timeline
          scenario={scenario}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
        <EpisodeDetail episode={episode} members={scenario.members} />
      </main>
    </div>
  );
}
