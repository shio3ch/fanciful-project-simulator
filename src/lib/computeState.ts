import {
  KPI_KEYS,
  type Kpi,
  type ProjectStatus,
  type Relationship,
  type Scenario,
} from "../types/scenario";

export interface SnapshotState {
  kpi: Kpi;
  taskCount: number;
  relationships: Relationship[];
  projectStatus: ProjectStatus;
}

export function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, v));
}

export function computeSeries(scenario: Scenario): SnapshotState[] {
  const series: SnapshotState[] = [];
  let kpi: Kpi = { ...scenario.initialKpi };
  let taskCount = scenario.initialTaskCount;
  let relationships: Relationship[] = scenario.initialRelationships.map((r) => ({ ...r }));

  for (const episode of scenario.episodes) {
    kpi = { ...kpi };
    for (const key of KPI_KEYS) {
      const delta = episode.kpiDelta[key];
      if (delta !== undefined) kpi[key] = clamp(kpi[key] + delta);
    }

    taskCount = Math.max(0, taskCount + episode.taskDelta);

    relationships = relationships.map((r) => ({ ...r }));
    for (const change of episode.relationshipChanges) {
      const existing = relationships.find(
        (r) => r.from === change.from && r.to === change.to,
      );
      if (existing) {
        existing.score = clamp(existing.score + change.delta);
        existing.type = change.type;
      } else {
        relationships.push({
          from: change.from,
          to: change.to,
          type: change.type,
          score: clamp(50 + change.delta),
        });
      }
    }

    series.push({
      kpi,
      taskCount,
      relationships: relationships.map((r) => ({ ...r })),
      projectStatus: episode.projectStatus,
    });
  }

  return series;
}
