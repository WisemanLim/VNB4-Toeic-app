import { create } from "zustand";
import type { Word, SentenceItem } from "@/core/schemas";

type BookmarkStore = {
  words: Record<string, Word>;
  sentences: Record<string, SentenceItem>;
  toggleWord: (word: Word) => void;
  toggleSentence: (sentence: SentenceItem) => void;
  hasWord: (id: string) => boolean;
  hasSentence: (id: string) => boolean;
};

export const useBookmarks = create<BookmarkStore>((set, get) => ({
  words: {},
  sentences: {},
  toggleWord: (word) =>
    set((s) => {
      const next = { ...s.words };
      if (next[word.id]) delete next[word.id];
      else next[word.id] = word;
      return { words: next };
    }),
  toggleSentence: (sentence) =>
    set((s) => {
      const next = { ...s.sentences };
      if (next[sentence.id]) delete next[sentence.id];
      else next[sentence.id] = sentence;
      return { sentences: next };
    }),
  hasWord: (id) => !!get().words[id],
  hasSentence: (id) => !!get().sentences[id],
}));
