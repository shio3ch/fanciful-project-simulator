import { describe, expect, test } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import sample1 from "../data/samples/sample1.json";
import { normalizeOpenAIScenario, OpenAIScenarioSchema } from "./openaiScenario";

describe("OpenAIScenarioSchema", () => {
  test("Structured Outputs用のJSON Schemaへ変換できる", () => {
    expect(() => zodTextFormat(OpenAIScenarioSchema, "scenario")).not.toThrow();
  });

  test("nullのKPI差分を省略形式へ正規化する", () => {
    const parsed = OpenAIScenarioSchema.parse({
      ...sample1,
      episodes: sample1.episodes.map((episode, index) => ({
        ...episode,
        kpiDelta: {
          morale: index === 0 ? 5 : null,
          quality: null,
          schedule: null,
          budget: null,
          customerSatisfaction: null,
        },
      })),
    });

    expect(normalizeOpenAIScenario(parsed).episodes[0].kpiDelta).toEqual({ morale: 5 });
  });
});
