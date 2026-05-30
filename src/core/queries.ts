import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import {
  AnalysisSchema,
  LessonListSchema,
  LessonSchema,
  ProgressListSchema,
  ProgressStatsSchema,
  SentenceListSchema,
  WordListSchema,
  type Progress,
} from "./schemas";

export const queryKeys = {
  analysis: ["me", "analysis"] as const,
  progressStats: ["progress", "stats"] as const,
  learn: (lessonId: string) => ["learn", lessonId] as const,
  sentences: (part: number) => ["sentences", part] as const,
  lessons: ["lessons"] as const,
};

/** Lesson catalog for the home screen (one starter lesson per part). */
export function useLessons() {
  return useQuery({
    queryKey: queryKeys.lessons,
    queryFn: () => api("/lessons", { schema: LessonListSchema }),
  });
}

/** 문장쓰기(단어 고르기)/쉐도잉 items for a TOEIC part (1–4). */
export function useSentences(part: number) {
  return useQuery({
    queryKey: queryKeys.sentences(part),
    queryFn: () => api(`/sentences?part=${part}&limit=200`, { schema: SentenceListSchema }),
    select: (res) => res.items,
  });
}

/** Home 취약유형결과 (평균/목표 점수 + LC/RC 분포). */
export function useAnalysis() {
  return useQuery({
    queryKey: queryKeys.analysis,
    queryFn: () => api("/me/analysis", { schema: AnalysisSchema }),
  });
}

/** Review-queue count shown on the home screen. */
export function useDueCount() {
  return useQuery({
    queryKey: queryKeys.progressStats,
    queryFn: () => api("/progress/stats", { schema: ProgressStatsSchema }),
    select: (stats) =>
      stats.find((s) => s.state === "review")?._count._all ?? 0,
  });
}

/**
 * Learning queue for a lesson id:
 *   "due"    → SRS review queue
 *   "part-N" → ALL words of TOEIC part N (paginated /words; guest=offline bundle,
 *              logged-in=server). Not capped at a starter-lesson's 20 words.
 *   else     → a specific lesson by id (/lessons/:id)
 */
export function useLearnQueue(lessonId: string) {
  return useQuery<Progress[]>({
    queryKey: queryKeys.learn(lessonId),
    queryFn: async () => {
      if (lessonId === "due") {
        return api("/progress/due?limit=30", { schema: ProgressListSchema });
      }
      const partMatch = /^part-(\d+)$/.exec(lessonId);
      if (partMatch) {
        const part = Number(partMatch[1]);
        const out: Progress[] = [];
        let cursor: string | undefined;
        // Page through every word in the part (backend caps limit at 100).
        for (let i = 0; i < 100; i++) {
          const qs = `part=${part}&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
          const res = await api(`/words?${qs}`, { schema: WordListSchema });
          for (const w of res.items) out.push({ id: w.id, wordId: w.id, word: w });
          if (!res.nextCursor) break;
          cursor = res.nextCursor;
        }
        return out;
      }
      const lesson = await api(`/lessons/${lessonId}`, { schema: LessonSchema });
      return lesson.words.map((lw) => ({
        id: lw.wordId,
        wordId: lw.wordId,
        word: lw.word,
      }));
    },
  });
}

/** Grade a word (SRS). Invalidates progress on success. */
export function useGradeWord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { wordId: string; grade: number }) =>
      api("/progress/grade", { method: "POST", json: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progress"] }),
  });
}
