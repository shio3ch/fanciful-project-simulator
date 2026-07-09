import { useMemo, useState } from "react";
import type { Scenario } from "./types/scenario";
import { computeSeries } from "./lib/computeState";
import { generateScenario } from "./lib/generateScenario";
import { clearApiKey, loadApiKey, saveApiKey } from "./lib/storage";
import { SAMPLE_SCENARIOS } from "./data/samples";
import Header from "./components/Header";
import ProjectSummary from "./components/ProjectSummary";
import MemberList from "./components/MemberList";
import RelationshipMap from "./components/RelationshipMap";
import HealthCheck from "./components/HealthCheck";
import BurndownChart from "./components/BurndownChart";
import Timeline from "./components/Timeline";
import EpisodeDetail from "./components/EpisodeDetail";
import Retrospective from "./components/Retrospective";
import SettingsModal from "./components/SettingsModal";
import GeneratingOverlay from "./components/GeneratingOverlay";

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(SAMPLE_SCENARIOS[0]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [apiKey, setApiKey] = useState<string>(() => loadApiKey() ?? "");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progressChars, setProgressChars] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const series = useMemo(() => computeSeries(scenario), [scenario]);
  const snapshot = series[selectedIndex];
  const episode = scenario.episodes[selectedIndex];
  const isLastEpisode = selectedIndex === scenario.episodes.length - 1;

  function loadScenario(next: Scenario) {
    setScenario(next);
    setSelectedIndex(0);
    setError(null);
  }

  function handleSaveSettings(key: string, persist: boolean) {
    setApiKey(key);
    if (persist && key) {
      saveApiKey(key);
    } else {
      clearApiKey();
    }
    setSettingsOpen(false);
  }

  async function handleGenerate() {
    if (!apiKey || generating) return;
    setGenerating(true);
    setProgressChars(0);
    setError(null);
    try {
      const next = await generateScenario(apiKey, setProgressChars);
      loadScenario(next);
    } catch (e) {
      setError(
        e instanceof Error
          ? `生成に失敗しました: ${e.message}`
          : "生成に失敗しました。もう一度お試しください。",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onGenerate={handleGenerate}
        onSelectSample={(i) => loadScenario(SAMPLE_SCENARIOS[i])}
        generating={generating}
        hasApiKey={apiKey.length > 0}
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 p-4">
        {error && (
          <div className="flex items-center justify-between rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={handleGenerate} className="font-bold underline">
              リトライ
            </button>
          </div>
        )}
        <ProjectSummary
          scenario={scenario}
          snapshot={snapshot}
          currentPhase={episode.phase}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <MemberList members={scenario.members} />
          <RelationshipMap
            members={scenario.members}
            relationships={snapshot.relationships}
          />
          <HealthCheck series={series} selectedIndex={selectedIndex} />
        </div>
        <BurndownChart
          scenario={scenario}
          series={series}
          selectedIndex={selectedIndex}
        />
        <Timeline
          scenario={scenario}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
        <EpisodeDetail episode={episode} members={scenario.members} />
        {isLastEpisode && <Retrospective scenario={scenario} />}
      </main>
      {settingsOpen && (
        <SettingsModal
          apiKey={apiKey}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {generating && <GeneratingOverlay progressChars={progressChars} />}
    </div>
  );
}
