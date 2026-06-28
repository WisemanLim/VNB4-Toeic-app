import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useSentences } from "@/core/queries";
import { useTts } from "@/features/learn/useTts";
import { Loading, EmptyView, ErrorView } from "@/ui";
import { colors, radius, spacing, fontSize } from "@/theme";
import { useBookmarks } from "@/store/bookmarks";
import type { SentenceItem } from "@/core/schemas";

const norm = (t: string) => t.toLowerCase().replace(/[.,?!]/g, "").trim();

const tts = (text: string) =>
  `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`;

function shuffle<T>(arr: T[], seedStr: string): T[] {
  let seed = 0;
  for (const c of seedStr) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoices(item: SentenceItem, pool: string[]): string[] {
  const answer = item.tokens;
  const answerSet = new Set(answer.map(norm));
  const distractors = pool.filter((t) => !answerSet.has(norm(t)));
  const picks = shuffle(distractors, item.id).slice(0, Math.min(3, distractors.length));
  return shuffle([...answer, ...picks], item.id + "x");
}

export default function WriteScreen() {
  const { part } = useLocalSearchParams<{ part: string }>();
  const partNum = Number(String(part).replace(/[^0-9]/g, "")) || 1;
  const { play } = useTts();

  const { data, isLoading, isError, error, refetch } = useSentences(partNum);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const toggleSentence = useBookmarks((s) => s.toggleSentence);
  const hasSentence = useBookmarks((s) => s.hasSentence);

  const pool = useMemo(
    () => Array.from(new Set((data ?? []).flatMap((s) => s.tokens))),
    [data],
  );
  const cur = data?.[idx];
  const choices = useMemo(() => (cur ? buildChoices(cur, pool) : []), [cur, pool]);

  if (isLoading) return <Loading />;
  if (isError) {
    return <ErrorView message={error instanceof Error ? error.message : "불러오기 실패"} onRetry={() => refetch()} />;
  }
  if (!data?.length) return <EmptyView message="문장 데이터가 없습니다." />;
  if (idx >= data.length) return <EmptyView message="완료! 🎉" />;
  if (!cur) return <EmptyView message="문장 데이터가 없습니다." />;

  const attempt = picked.map((i) => choices[i]);
  const isCorrect =
    attempt.length === cur.tokens.length &&
    attempt.every((t, i) => norm(t) === norm(cur.tokens[i]));
  const isFav = hasSentence(cur.id);

  function pick(i: number) {
    if (checked) return;
    setPicked((p) => (p.includes(i) ? p : [...p, i]));
  }
  function unpick(slot: number) {
    if (checked) return;
    setPicked((p) => p.filter((_, k) => k !== slot));
  }
  function next() {
    setChecked(false);
    setPicked([]);
    setShowHint(false);
    setIdx((i) => i + 1);
  }
  function goPrev() {
    if (idx === 0) return;
    setChecked(false);
    setPicked([]);
    setShowHint(false);
    setIdx((i) => Math.max(0, i - 1));
  }
  async function speak(text: string) {
    try {
      await play(tts(text));
    } catch {
      // best-effort
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.scroll}>
      <Text style={styles.progress}>{idx + 1} / {data.length} · Part {cur.part}</Text>

      <View style={styles.card}>
        <Text style={styles.hint}>{cur.translationKo}</Text>
        <Text style={styles.prompt}>{cur.prompt}</Text>

        {/* 힌트 패널 */}
        {showHint && (
          <View style={styles.hintBox}>
            <Text style={styles.hintBoxLabel}>💡 힌트</Text>
            <Text style={styles.hintBoxText}>{cur.fullSentence}</Text>
          </View>
        )}

        {/* 선택한 단어 */}
        <View style={styles.answerRow}>
          {attempt.length === 0 ? (
            <Text style={styles.answerPlaceholder}>아래에서 단어를 골라 문장을 완성하세요</Text>
          ) : (
            attempt.map((t, slot) => (
              <Pressable key={slot} style={styles.pickedChip} onPress={() => unpick(slot)}>
                <Text style={styles.pickedChipText}>{t}</Text>
              </Pressable>
            ))
          )}
        </View>

        {!checked && (
          <View style={styles.choiceRow}>
            {choices.map((t, i) => (
              <Pressable
                key={i}
                style={[styles.choiceChip, picked.includes(i) && styles.choiceChipUsed]}
                onPress={() => pick(i)}
                disabled={picked.includes(i)}
              >
                <Text style={styles.choiceChipText}>{t}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {checked && (
          <View style={styles.resultBox}>
            <Text style={[styles.resultLabel, { color: isCorrect ? "#16a34a" : "#dc2626" }]}>
              {isCorrect ? "정답! ✓" : "정답을 확인하세요"}
            </Text>
            <View style={styles.shadowRow}>
              <Text style={styles.fullSentence}>{cur.fullSentence}</Text>
              <Pressable hitSlop={10} style={styles.ttsBtn} onPress={() => speak(cur.fullSentence)}>
                <Text style={styles.ttsIcon}>🔊</Text>
              </Pressable>
            </View>
            <Text style={styles.shadowHint}>🎧 듣고 따라 말하기(쉐도잉)</Text>
          </View>
        )}
      </View>

      {/* 툴바: 이전 | 힌트 | 북마크 | 확인/다음 */}
      <View style={styles.toolbar}>
        <Pressable
          style={[styles.iconBtn, idx === 0 && styles.iconBtnDisabled]}
          onPress={goPrev}
          disabled={idx === 0}
        >
          <Text style={styles.iconBtnText}>‹</Text>
        </Pressable>

        <Pressable
          style={[styles.iconBtn, showHint && styles.iconBtnActive]}
          onPress={() => setShowHint((h) => !h)}
        >
          <Text style={styles.iconBtnText}>💡</Text>
        </Pressable>

        <Pressable style={styles.iconBtn} onPress={() => toggleSentence(cur)}>
          <Text style={styles.iconBtnText}>{isFav ? "🔖" : "🏷"}</Text>
        </Pressable>

        <Pressable
          style={[
            styles.confirmBtn,
            !checked && picked.length === 0 && styles.confirmBtnDisabled,
          ]}
          disabled={!checked && picked.length === 0}
          onPress={!checked ? () => setChecked(true) : next}
        >
          <Text style={styles.confirmBtnText}>{!checked ? "확인" : "다음 ›"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const CARD = "#ffffff";
const INK = "#0f172a";
const INK_MUTED = "#64748b";

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md },
  progress: { color: colors.textMuted, fontSize: fontSize.sm },
  card: {
    backgroundColor: CARD,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hint: { color: INK_MUTED, fontSize: fontSize.md },
  prompt: { color: INK, fontSize: fontSize.xl, fontWeight: "700", lineHeight: 30 },
  hintBox: {
    backgroundColor: "#fef9c3",
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  hintBoxLabel: { color: "#854d0e", fontSize: fontSize.sm, fontWeight: "700" },
  hintBoxText: { color: "#713f12", fontSize: fontSize.md, lineHeight: 24 },
  answerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    minHeight: 48,
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
    paddingBottom: spacing.sm,
    alignItems: "center",
  },
  answerPlaceholder: { color: "#94a3b8", fontSize: fontSize.sm },
  pickedChip: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pickedChipText: { color: "#ffffff", fontWeight: "700", fontSize: fontSize.base },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  choiceChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  choiceChipUsed: { opacity: 0.3 },
  choiceChipText: { color: INK, fontSize: fontSize.md, fontWeight: "600" },
  resultBox: { gap: spacing.sm, marginTop: spacing.xs },
  resultLabel: { fontSize: fontSize.md, fontWeight: "800" },
  shadowRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  fullSentence: { flex: 1, color: INK, fontSize: fontSize.md, fontWeight: "700", lineHeight: 26 },
  ttsBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  ttsIcon: { fontSize: 18 },
  shadowHint: { color: INK_MUTED, fontSize: fontSize.sm },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDisabled: { opacity: 0.35 },
  iconBtnActive: { borderColor: colors.accent, backgroundColor: "#0c2d40" },
  iconBtnText: { fontSize: 20 },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: colors.bg, fontWeight: "700", fontSize: fontSize.base },
});
