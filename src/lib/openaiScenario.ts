import { z } from "zod";
import { EpisodeSchema, KPI_KEYS, ScenarioSchema, type Scenario } from "../types/scenario";

export const OpenAIKpiDeltaSchema = z.object({
  morale: z.number().nullable(),
  quality: z.number().nullable(),
  schedule: z.number().nullable(),
  budget: z.number().nullable(),
  customerSatisfaction: z.number().nullable(),
});

export const OpenAIScenarioSchema = ScenarioSchema.extend({
  episodes: z.array(
    EpisodeSchema.extend({
      kpiDelta: OpenAIKpiDeltaSchema,
    }),
  ).min(1),
});

type OpenAIScenario = z.infer<typeof OpenAIScenarioSchema>;

export function normalizeOpenAIScenario(scenario: OpenAIScenario): Scenario {
  return ScenarioSchema.parse({
    ...scenario,
    episodes: scenario.episodes.map(({ kpiDelta, ...episode }) => ({
      ...episode,
      kpiDelta: Object.fromEntries(
        KPI_KEYS.flatMap((key) => {
          const delta = kpiDelta[key];
          return delta === null ? [] : [[key, delta]];
        }),
      ),
    })),
  });
}
