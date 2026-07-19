import type { ApiProvider } from "./storage";

export const OPENAI_BILLING_URL = "https://platform.openai.com/settings/organization/billing";
export const OPENAI_LIMITS_URL = "https://platform.openai.com/settings/organization/limits";

export type GenerationErrorDetails = {
  message: string;
  action: "retry" | "openai-quota";
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function isOpenAIQuotaError(error: unknown): boolean {
  const outer = asRecord(error);
  const inner = asRecord(outer?.error);
  const code = outer?.code ?? inner?.code;
  const type = outer?.type ?? inner?.type;
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    code === "insufficient_quota" ||
    type === "insufficient_quota" ||
    message.includes("exceeded your current quota") ||
    message.includes("check your plan and billing details")
  );
}

export function describeGenerationError(
  error: unknown,
  provider: ApiProvider,
): GenerationErrorDetails {
  if (provider === "openai" && isOpenAIQuotaError(error)) {
    return {
      message:
        "OpenAI APIのクレジット残高がないか、組織またはプロジェクトの月間利用上限に達しています。請求設定と利用上限を確認してから、もう一度生成してください。",
      action: "openai-quota",
    };
  }

  return {
    message:
      error instanceof Error
        ? `生成に失敗しました: ${error.message}`
        : "生成に失敗しました。もう一度お試しください。",
    action: "retry",
  };
}
