import { describe, expect, test } from "vitest";
import { describeGenerationError } from "./generationError";

describe("describeGenerationError", () => {
  test("OpenAIのinsufficient_quotaを利用枠エラーとして案内する", () => {
    const result = describeGenerationError(
      Object.assign(new Error("429 You exceeded your current quota"), {
        status: 429,
        code: "insufficient_quota",
        type: "insufficient_quota",
      }),
      "openai",
    );

    expect(result.action).toBe("openai-quota");
    expect(result.message).toContain("月間利用上限");
  });

  test("SDKのコードがなくても公式のクォータ超過メッセージを判別する", () => {
    const result = describeGenerationError(
      new Error("You exceeded your current quota, please check your plan and billing details."),
      "openai",
    );

    expect(result.action).toBe("openai-quota");
  });

  test("その他のエラーは従来どおりリトライ可能として表示する", () => {
    const result = describeGenerationError(new Error("一時的なエラー"), "openai");

    expect(result).toEqual({
      message: "生成に失敗しました: 一時的なエラー",
      action: "retry",
    });
  });
});
