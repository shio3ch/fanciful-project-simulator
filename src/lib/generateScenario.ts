import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ScenarioSchema, type Scenario } from "../types/scenario";
import { buildScenarioPrompt } from "./prompt";

export async function generateScenario(
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
