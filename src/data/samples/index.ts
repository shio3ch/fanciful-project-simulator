import { ScenarioSchema, type Scenario } from "../../types/scenario";
import sample1 from "./sample1.json";
import sample2 from "./sample2.json";

export const SAMPLE_SCENARIOS: Scenario[] = [
  ScenarioSchema.parse(sample1),
  ScenarioSchema.parse(sample2),
];
