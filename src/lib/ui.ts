import type { ProjectStatus, RelationType } from "../types/scenario";

export type StatusKey =
  | "calm"
  | "hazy"
  | "caution"
  | "flame"
  | "collapse"
  | "miracle"
  | "release";

export const STATUS_KEYS: Record<ProjectStatus, StatusKey> = {
  順調: "calm",
  少し怪しい: "hazy",
  黄色信号: "caution",
  炎上中: "flame",
  崩壊寸前: "collapse",
  奇跡の復活: "miracle",
  無事リリース: "release",
};

export const STATUS_EMOJI: Record<ProjectStatus, string> = {
  順調: "✅",
  少し怪しい: "🤔",
  黄色信号: "⚠️",
  炎上中: "🔥",
  崩壊寸前: "💀",
  奇跡の復活: "🌈",
  無事リリース: "🎉",
};

export const REL_COLORS: Record<RelationType, string> = {
  尊敬: "var(--rel-respect)",
  信頼: "var(--rel-trust)",
  苦手: "var(--rel-awkward)",
  ライバル: "var(--rel-rival)",
  仲良し: "var(--rel-buddy)",
};

export function formatDelta(v: number): string {
  if (v > 0) return `+${v}`;
  if (v < 0) return `${v}`;
  return "±0";
}

export function deltaColor(v: number): string {
  if (v > 0) return "text-emerald-500";
  if (v < 0) return "text-red-500";
  return "text-ink-muted";
}

export function deltaArrow(v: number): string {
  if (v > 0) return "▲";
  if (v < 0) return "▼";
  return "—";
}
