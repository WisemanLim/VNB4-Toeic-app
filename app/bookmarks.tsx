import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useBookmarks } from "@/store/bookmarks";
import { colors, radius, spacing, fontSize } from "@/theme";

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
  phrase: "표현",
};

export default function BookmarksScreen() {
  const words = useBookmarks((s) => Object.values(s.words));
  const sentences = useBookmarks((s) => Object.values(s.sentences));

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.scroll}
    >
      {/* ── 단어 북마크 ── */}
      <Text style={styles.sectionTitle}>단어 북마크 ({words.length})</Text>
      {words.length === 0 ? (
        <Text style={styles.empty}>학습 화면에서 🏷 탭하여 단어를 저장하세요.</Text>
      ) : (
        words.map((w) => (
          <View key={w.id} style={styles.wordCard}>
            <View style={styles.wordRow}>
              <Text style={styles.word}>{w.word}</Text>
              {w.pos && (
                <Text style={styles.pos}>{POS_KO[w.pos] ?? w.pos}</Text>
              )}
            </View>
            <Text style={styles.meaning}>{w.meaningKo}</Text>
            {w.exampleEn && (
              <Text style={styles.example} numberOfLines={2}>
                {w.exampleEn}
              </Text>
            )}
          </View>
        ))
      )}

      {/* ── 문장 북마크 ── */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
        문장 북마크 ({sentences.length})
      </Text>
      {sentences.length === 0 ? (
        <Text style={styles.empty}>문장쓰기 화면에서 🏷 탭하여 문장을 저장하세요.</Text>
      ) : (
        sentences.map((s) => (
          <View key={s.id} style={styles.sentenceCard}>
            <View style={styles.partBadgeRow}>
              <Text style={styles.partBadge}>Part {s.part}</Text>
            </View>
            <Text style={styles.sentenceText}>{s.fullSentence}</Text>
            <Text style={styles.translation}>{s.translationKo}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  wordCard: {
    backgroundColor: "#ffffff",
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
    marginBottom: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  wordRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  word: { fontSize: fontSize.xl, fontWeight: "800", color: "#0f172a" },
  pos: {
    fontSize: fontSize.xs,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    fontWeight: "600",
  },
  meaning: { fontSize: fontSize.md, fontWeight: "700", color: "#1e293b" },
  example: { fontSize: fontSize.sm, color: "#64748b", lineHeight: 20 },
  sentenceCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partBadgeRow: { flexDirection: "row" },
  partBadge: {
    fontSize: fontSize.xs,
    color: colors.accent,
    fontWeight: "700",
    backgroundColor: "#0c2d40",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  sentenceText: {
    fontSize: fontSize.md,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 24,
  },
  translation: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
});
