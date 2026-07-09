import { z } from "zod";

export const KPI_KEYS = [
  "morale",
  "quality",
  "schedule",
  "budget",
  "customerSatisfaction",
] as const;

export const KPI_LABELS: Record<(typeof KPI_KEYS)[number], string> = {
  morale: "士気",
  quality: "品質",
  schedule: "スケジュール",
  budget: "予算",
  customerSatisfaction: "顧客満足度",
};

export const KpiSchema = z.object({
  morale: z.number(),
  quality: z.number(),
  schedule: z.number(),
  budget: z.number(),
  customerSatisfaction: z.number(),
});

export const KpiDeltaSchema = KpiSchema.partial();

export const RelationTypeSchema = z.enum([
  "尊敬",
  "信頼",
  "苦手",
  "ライバル",
  "仲良し",
]);

export const PhaseSchema = z.enum([
  "キックオフ",
  "要件定義",
  "基本設計",
  "詳細設計",
  "開発",
  "テスト",
  "リリース",
]);

export const ProjectStatusSchema = z.enum([
  "順調",
  "少し怪しい",
  "黄色信号",
  "炎上中",
  "崩壊寸前",
  "奇跡の復活",
  "無事リリース",
]);

export const MemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  role: z.string(),
  catchphrase: z.string(),
  personality: z.string(),
  strengths: z.string(),
  weaknesses: z.string(),
  stats: z.object({
    technical: z.number(),
    communication: z.number(),
    mental: z.number(),
    luck: z.number(),
  }),
  specialSkill: z.string(),
});

export const RelationshipSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: RelationTypeSchema,
  score: z.number(),
});

export const RelationshipChangeSchema = z.object({
  from: z.string(),
  to: z.string(),
  type: RelationTypeSchema,
  delta: z.number(),
});

export const ChatMessageSchema = z.object({
  speaker: z.string(),
  message: z.string(),
});

export const EpisodeSchema = z.object({
  id: z.string(),
  phase: PhaseSchema,
  headline: z.string(),
  summary: z.string(),
  story: z.string(),
  chatLog: z.array(ChatMessageSchema),
  minutes: z.array(z.string()),
  kpiDelta: KpiDeltaSchema,
  taskDelta: z.number(),
  relationshipChanges: z.array(RelationshipChangeSchema),
  tags: z.array(z.string()),
  projectStatus: ProjectStatusSchema,
});

export const ScenarioSchema = z.object({
  project: z.object({
    name: z.string(),
    client: z.string(),
    overview: z.string(),
    period: z.string(),
    budget: z.string(),
    difficulty: z.string(),
  }),
  members: z.array(MemberSchema),
  initialRelationships: z.array(RelationshipSchema),
  initialKpi: KpiSchema,
  initialTaskCount: z.number(),
  episodes: z.array(EpisodeSchema),
  retrospective: z.object({
    summary: z.string(),
    mvp: z.object({ memberId: z.string(), reason: z.string() }),
    warCriminal: z.object({ memberId: z.string(), reason: z.string() }),
    famousQuote: z.string(),
    lessonsLearned: z.array(z.string()),
    finalScores: z.object({
      delivery: z.number(),
      quality: z.number(),
      customerSatisfaction: z.number(),
      teamwork: z.number(),
      flameLevel: z.number(),
    }),
    finalComment: z.string(),
  }),
});

export type Kpi = z.infer<typeof KpiSchema>;
export type KpiDelta = z.infer<typeof KpiDeltaSchema>;
export type RelationType = z.infer<typeof RelationTypeSchema>;
export type Phase = z.infer<typeof PhaseSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type RelationshipChange = z.infer<typeof RelationshipChangeSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
