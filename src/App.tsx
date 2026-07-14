import { useMemo, useState } from "react";
import type { Scenario } from "./types/scenario";
import { computeSeries } from "./lib/computeState";
import { generateScenario } from "./lib/generateScenario";
import {
  clearApiSettings,
  loadApiSettings,
  saveApiSettings,
  type ApiProvider,
  type ApiSettings,
} from "./lib/storage";
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
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() =>
    loadApiSettings() ?? { provider: "anthropic", apiKey: "" },
  );
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

  function handleSaveSettings(provider: ApiProvider, apiKey: string, persist: boolean) {
    const settings = { provider, apiKey };
    setApiSettings(settings);
    if (persist && apiKey) {
      saveApiSettings(settings);
    } else {
      clearApiSettings();
    }
    setSettingsOpen(false);
  }

  async function handleGenerate() {
    if (!apiSettings.apiKey || generating) return;
    setGenerating(true);
    setProgressChars(0);
    setError(null);
    try {
      const next = await generateScenario(apiSettings, setProgressChars);
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
        hasApiKey={apiSettings.apiKey.length > 0}
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
        <div className="grid items-start gap-4 lg:grid-cols-3">
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
          provider={apiSettings.provider}
          apiKey={apiSettings.apiKey}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {generating && <GeneratingOverlay progressChars={progressChars} />}
    </div>
  );
}
