import { create } from "zustand";

type LearnProgressStore = {
  indices: Record<string, number>;
  setIdx: (lessonId: string, idx: number) => void;
};

export const useLearnProgress = create<LearnProgressStore>((set) => ({
  indices: {},
  setIdx: (lessonId, idx) =>
    set((s) => ({ indices: { ...s.indices, [lessonId]: idx } })),
}));
