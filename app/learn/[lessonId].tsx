import { View, Text, Pressable, StyleSheet, Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useLearnQueue, useGradeWord } from "@/core/queries";
import { useTts } from "@/features/learn/useTts";
import { Loading, EmptyView, ErrorView } from "@/ui";
import { colors, radius, spacing, fontSize } from "@/theme";

// pos is free-form from the backend; map known values (incl. abbreviations) to
// Korean, fall back to the raw string for anything unmapped.
const POS_KO: Record<string, string> = {
  noun: "명사",
  verb: "동사",
  adjective: "형용사",
  adj: "형용사",
  adverb: "부사",
  adv: "부사",
  preposition: "전치사",
  prep: "전치사",
  conjunction: "접속사",
  conj: "접속사",
  pronoun: "대명사",
  "wh-word": "의문사",
  determiner: "한정사",
  det: "한정사",
  modal: "조동사",
  phrase: "표현",
  abbr: "약어",
  interjection: "감탄사",
};
const posLabel = (pos?: string | null) => (pos ? (POS_KO[pos] ?? pos) : "");

// Backend words often have no imageUrl; fall back to a deterministic illustration
// (same scheme as the offline mock) so the card always shows an image.
const wordImage = (word: string, imageUrl?: string | null) =>
  imageUrl || `https://picsum.photos/seed/toeic-${encodeURIComponent(word)}/640/420`;

// SRS grade mapped to the simple toolbar: next = 알아요(4), delete = 모르겠어요(1).
const GRADE_KNOWN = 4;
const GRADE_UNKNOWN = 1;

/** Renders an example sentence with the target word bolded. */
function ExampleSentence({ text, word }: { text: string; word: string }) {
  const parts = text.split(new RegExp(`(${word})`, "ig"));
  return (
    <Text style={styles.exampleEn}>
      {parts.map((p, i) =>
        p.toLowerCase() === word.toLowerCase() ? (
          <Text key={i} style={styles.exampleEnBold}>
            {p}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

export default function LearnScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { play } = useTts();

  const { data, isLoading, isError, error, refetch } = useLearnQueue(lessonId);
  const grade = useGradeWord();

  function advance(g: number) {
    if (!data) return;
    grade.mutate(
      { wordId: data[idx].wordId, grade: g },
      {
        onSuccess: () => {
          setReveal(false);
          setIdx((i) => i + 1);
        },
      },
    );
  }

  function goPrev() {
    setReveal(false);
    setIdx((i) => Math.max(0, i - 1));
  }

  function toggleFavorite(wordId: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) next.delete(wordId);
      else next.add(wordId);
      return next;
    });
  }

  if (isLoading) return <Loading />;
  if (isError) {
    return (
      <ErrorView
        message={error instanceof Error ? error.message : "불러오기 실패"}
        onRetry={() => refetch()}
      />
    );
  }
  if (!data?.length) return <EmptyView message="학습할 단어가 없습니다." />;
  if (idx >= data.length) return <EmptyView message="완료! 🎉" />;

  const cur = data[idx].word;
  const wordId = data[idx].wordId;
  const usAudio = cur.audio.find((a) => a.locale === "en_US")?.url ?? cur.audio[0]?.url;
  const isFav = favorites.has(wordId);

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>
        {idx + 1} / {data.length}
      </Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable
          style={styles.card}
          onPress={() => {
            if (!reveal) {
              setReveal(true);
              play(usAudio);
            }
          }}
        >
          <Image
            source={{ uri: wordImage(cur.word, cur.imageUrl) }}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.body}>
            {cur.pos && <Text style={styles.pos}>{posLabel(cur.pos)}</Text>}

            <View style={styles.wordRow}>
              <Text style={styles.word}>{cur.word}</Text>
              <Pressable hitSlop={10} style={styles.ttsBtn} onPress={() => play(usAudio)}>
                <Text style={styles.ttsIcon}>🔊</Text>
              </Pressable>
            </View>

            {(cur.ipa || cur.pronKo) && (
              <Text style={styles.phonetic}>
                {[cur.ipa, cur.pronKo].filter(Boolean).join("  ·  ")}
              </Text>
            )}

            <View style={styles.localeRow}>
              {cur.audio.map((a) => (
                <Pressable key={a.locale} style={styles.localeChip} onPress={() => play(a.url)}>
                  <Text style={styles.localeChipText}>{a.locale.replace("_", "-")}</Text>
                </Pressable>
              ))}
            </View>

            {reveal ? (
              <>
                <Text style={styles.meaning}>{cur.meaningKo}</Text>
                {cur.exampleEn && (
                  <View style={styles.divider} />
                )}
                {cur.exampleEn && (
                  <View style={styles.exampleRow}>
                    <View style={{ flex: 1 }}>
                      <ExampleSentence text={cur.exampleEn} word={cur.word} />
                      {cur.exampleKo && <Text style={styles.exampleKo}>{cur.exampleKo}</Text>}
                    </View>
                    <Pressable
                      hitSlop={10}
                      style={styles.ttsBtnSmall}
                      onPress={() => play(usAudio)}
                    >
                      <Text style={styles.ttsIconSmall}>🔊</Text>
                    </Pressable>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.revealHint}>탭하여 뜻 보기</Text>
            )}
          </View>
        </Pressable>
      </ScrollView>

      <View style={[styles.toolbar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          style={[styles.navBtn, idx === 0 && styles.navBtnDisabled]}
          onPress={goPrev}
          disabled={idx === 0}
        >
          <Text style={styles.navIcon}>‹</Text>
        </Pressable>

        <Pressable
          style={styles.midBtn}
          onPress={() => advance(GRADE_UNKNOWN)}
          disabled={grade.isPending}
        >
          <Text style={styles.midIcon}>🗑</Text>
        </Pressable>

        <Pressable style={styles.midBtn} onPress={() => toggleFavorite(wordId)}>
          <Text style={styles.midIcon}>{isFav ? "🔖" : "🏷"}</Text>
        </Pressable>

        <Pressable
          style={styles.navBtn}
          onPress={() => advance(GRADE_KNOWN)}
          disabled={grade.isPending}
        >
          <Text style={styles.navIcon}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Light card palette (reference uses a light card on the dark app background).
const CARD = "#ffffff";
const INK = "#0f172a";
const INK_MUTED = "#64748b";
const LINE = "#e2e8f0";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  progress: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  scroll: { padding: spacing.lg, flexGrow: 1 },
  card: {
    backgroundColor: CARD,
    borderRadius: radius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  image: { width: "100%", height: 200, backgroundColor: LINE },
  body: { padding: spacing.xl },
  pos: { color: INK_MUTED, fontSize: fontSize.sm, marginBottom: 2 },
  wordRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  word: { fontSize: 34, fontWeight: "800", color: INK },
  ttsBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  ttsIcon: { fontSize: 18 },
  phonetic: { color: INK_MUTED, fontSize: fontSize.base, marginTop: 6 },
  localeRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.md },
  localeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "#f1f5f9",
  },
  localeChipText: { fontSize: fontSize.xs, color: INK_MUTED, fontWeight: "600" },
  meaning: { fontSize: fontSize.xl, fontWeight: "700", color: INK, marginTop: spacing.lg },
  divider: { height: 1, backgroundColor: LINE, marginVertical: spacing.lg },
  exampleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  exampleEn: { fontSize: fontSize.md, color: INK, lineHeight: 24 },
  exampleEnBold: { fontWeight: "800", color: INK },
  exampleKo: { fontSize: fontSize.base, color: INK_MUTED, marginTop: 6, lineHeight: 22 },
  ttsBtnSmall: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  ttsIconSmall: { fontSize: 15 },
  revealHint: {
    marginTop: spacing.xl,
    textAlign: "center",
    color: INK_MUTED,
    fontSize: fontSize.base,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
  navBtn: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElev,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: { opacity: 0.35 },
  navIcon: { color: colors.text, fontSize: 30, fontWeight: "700", lineHeight: 34 },
  midBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  midIcon: { fontSize: 20 },
});
