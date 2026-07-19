import type { ProjectStatus, RelationType } from "../types/scenario";

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  順調: "bg-emerald-100 text-emerald-800 border-emerald-300",
  少し怪しい: "bg-lime-100 text-lime-800 border-lime-300",
  黄色信号: "bg-amber-100 text-amber-800 border-amber-300",
  炎上中: "bg-orange-100 text-orange-800 border-orange-300",
  崩壊寸前: "bg-red-100 text-red-800 border-red-300",
  奇跡の復活: "bg-sky-100 text-sky-800 border-sky-300",
  無事リリース: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

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
  尊敬: "#0ea5e9",
  信頼: "#10b981",
  苦手: "#f59e0b",
  ライバル: "#8b5cf6",
  仲良し: "#ec4899",
};

export function formatDelta(v: number): string {
  if (v > 0) return `+${v}`;
  if (v < 0) return `${v}`;
  return "±0";
}

export function deltaColor(v: number): string {
  if (v > 0) return "text-emerald-600";
  if (v < 0) return "text-red-600";
  return "text-slate-500";
}
