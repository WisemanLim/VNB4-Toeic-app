import { z } from "zod";

/** Single source of truth for API payload shapes. Inferred types are exported. */

export const LocaleSchema = z.enum(["en_US", "en_GB", "en_AU"]);

export const AudioClipSchema = z.object({
  locale: LocaleSchema,
  provider: z.string(),
  url: z.string().url(),
});

/**
 * `part` arrives as a number from the offline mock/seed (1..7) but as the Prisma
 * enum string ("P1".."P7") from the real backend. Coerce both → number.
 */
const partToNumber = (v: unknown) =>
  typeof v === "string" ? Number(v.replace(/[^0-9]/g, "")) || undefined : v;
export const PartNumberOptional = z.preprocess(partToNumber, z.number().int().optional());
export const PartNumberRequired = z.preprocess(partToNumber, z.number().int());

/** Part of speech. PRD §2.2 `pos`. */
export const PosSchema = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "phrase",
]);

// Optional string fields are `.nullish()` — the backend returns null for unset
// columns, while the mock omits them; both must pass.
export const WordSchema = z.object({
  id: z.string(),
  word: z.string(),
  meaningKo: z.string(),
  // Backend `pos` is free-form (collected data has abbreviations like "prep",
  // "adj", and non-standard tags). Accept any string so a list never fails to
  // parse; the UI maps known values to Korean labels and shows the rest raw.
  pos: z.string().nullish(),
  ipa: z.string().nullish(),
  pronKo: z.string().nullish(),
  exampleEn: z.string().nullish(),
  exampleKo: z.string().nullish(),
  imageUrl: z.string().nullish(), // backend may send null/relative; don't enforce url()
  part: PartNumberOptional,
  topic: z.array(z.string()).nullish(),
  synonyms: z.array(z.string()).nullish(),
  frequencyTier: z.number().int().nullish(),
  audio: z.array(AudioClipSchema).default([]),
});

/** Paginated word list (GET /words). */
export const WordListSchema = z.object({
  items: z.array(WordSchema),
  nextCursor: z.string().nullable().optional(),
});

export const ProgressSchema = z.object({
  id: z.string(),
  wordId: z.string(),
  word: WordSchema,
});

export const ProgressListSchema = z.array(ProgressSchema);

export const ProgressStatSchema = z.object({
  state: z.string(),
  _count: z.object({ _all: z.number() }),
});
export const ProgressStatsSchema = z.array(ProgressStatSchema);

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  // Backend serves the part enum ("P1"); the offline mock uses a number.
  part: z.union([z.number(), z.string()]).optional(),
  orderIndex: z.number().int().optional(),
  words: z
    .array(z.object({ wordId: z.string(), word: WordSchema }))
    .default([]),
});

/** Lesson catalog (GET /lessons). */
export const LessonListSchema = z.array(LessonSchema);

export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string().default("user"),
  name: z.string().nullable().optional(),
});
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  user: SessionUserSchema.optional(),
});

/** Home "취약유형결과" analysis (PRD §1.3 진도/통계). */
export const AnalysisSegmentSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string(),
});
export const AnalysisSchema = z.object({
  avgScore: z.number(),
  targetScore: z.number(),
  tested: z.boolean().default(false),
  segments: z.array(AnalysisSegmentSchema).default([]),
});

export type Locale = z.infer<typeof LocaleSchema>;
export type Pos = z.infer<typeof PosSchema>;
export type AudioClip = z.infer<typeof AudioClipSchema>;
export type Word = z.infer<typeof WordSchema>;
export type WordList = z.infer<typeof WordListSchema>;
export type Progress = z.infer<typeof ProgressSchema>;
export type ProgressStat = z.infer<typeof ProgressStatSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type LessonList = z.infer<typeof LessonListSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type SessionUser = z.infer<typeof SessionUserSchema>;
export type AnalysisSegment = z.infer<typeof AnalysisSegmentSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;

/** 문장쓰기(단어 고르기) + 쉐도잉 item — Hackers 800+ 받아쓰기/쉐도잉. */
export const SentenceItemSchema = z.object({
  id: z.string(),
  part: PartNumberRequired, // number (mock) or "P1" (backend)
  day: z.number().int().nullish(),
  order: z.number().int().nullish(), // mock/seed field
  orderIndex: z.number().int().nullish(), // backend field
  prompt: z.string(),
  answer: z.string(),
  fullSentence: z.string(),
  translationKo: z.string(),
  tokens: z.array(z.string()).default([]),
});
export const SentenceListSchema = z.object({
  items: z.array(SentenceItemSchema),
  nextCursor: z.string().nullable().optional(),
});
export type SentenceItem = z.infer<typeof SentenceItemSchema>;
