import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { ScenarioSchema, type Scenario } from "../types/scenario";
import { buildScenarioPrompt } from "./prompt";
import type { ApiSettings } from "./storage";

export async function generateScenario(
  settings: ApiSettings,
  onProgress?: (charCount: number) => void,
): Promise<Scenario> {
  if (settings.provider === "openai") {
    return generateWithOpenAI(settings.apiKey, onProgress);
  }

  return generateWithAnthropic(settings.apiKey, onProgress);
}

async function generateWithAnthropic(
  apiKey: string,
  onProgress?: (charCount: number) => void,
): Promise<Scenario> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  let received = 0;
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 64000,
    thinking: { type: "adaptive" },
    output_config: { format: zodOutputFormat(ScenarioSchema) },
    messages: [{ role: "user", content: buildScenarioPrompt() }],
  });

  stream.on("text", (delta) => {
    received += delta.length;
    onProgress?.(received);
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "max_tokens") {
    throw new Error("生成が長すぎて途中で打ち切られました。もう一度お試しください。");
  }

  if (message.stop_reason === "refusal") {
    throw new Error("AIが生成を拒否しました。もう一度お試しください。");
  }

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AIの応答にテキストが含まれていませんでした。");
  }

  return ScenarioSchema.parse(JSON.parse(textBlock.text));
}

async function generateWithOpenAI(
  apiKey: string,
  onProgress?: (charCount: number) => void,
): Promise<Scenario> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  let received = 0;
  const stream = client.responses
    .stream({
      model: "gpt-5.4",
      input: [{ role: "user", content: buildScenarioPrompt() }],
      max_output_tokens: 64000,
      text: { format: zodTextFormat(ScenarioSchema, "scenario") },
    })
    .on("response.output_text.delta", (event) => {
      received += event.delta.length;
      onProgress?.(received);
    });

  const response = await stream.finalResponse();
  if (response.status === "incomplete") {
    throw new Error("生成が長すぎて途中で打ち切られました。もう一度お試しください。");
  }
  if (!response.output_parsed) {
    throw new Error("AIの応答をシナリオとして読み取れませんでした。");
  }

  return ScenarioSchema.parse(response.output_parsed);
}
