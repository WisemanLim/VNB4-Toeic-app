import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useAnalysis, useDueCount } from "@/core/queries";
import { useAuth } from "@/core/auth";
import { ScoreDonut } from "@/features/home/ScoreDonut";
import { colors, radius, spacing, fontSize } from "@/theme";

const PARTS = [
  { p: 1, title: "Part 1", desc: "사진묘사", color: "#5b8def", icon: "📷" },
  { p: 2, title: "Part 2", desc: "질의응답", color: "#7c6cf0", icon: "💬" },
  { p: 3, title: "Part 3", desc: "대화", color: "#2bb3a3", icon: "🗣️" },
  { p: 4, title: "Part 4", desc: "담화", color: "#e0a13c", icon: "📢" },
  { p: 5, title: "Part 5", desc: "문장완성", color: "#e06c9f", icon: "✍️" },
  { p: 6, title: "Part 6", desc: "지문완성", color: "#6aa84f", icon: "📄" },
  { p: 7, title: "Part 7", desc: "독해", color: "#c0763e", icon: "📚" },
];

// TOEIC: LC = Part 1–4 (듣기), RC = Part 5–7 (독해).
const LC_PARTS = PARTS.filter((p) => p.p <= 4);
const RC_PARTS = PARTS.filter((p) => p.p >= 5);

type Part = (typeof PARTS)[number];

export default function Home() {
  const { data: due = 0 } = useDueCount();
  const { data: analysis } = useAnalysis();
  const { status, user, logout } = useAuth();

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      {/* ── 인증 바: 게스트 CTA / 로그인 사용자 + 로그아웃 ── */}
      {status === "authed" ? (
        <View style={styles.authRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.authName}>{user?.name || user?.email || "로그인됨"}</Text>
            <Text style={styles.authDesc}>서버와 동기화 중 · 복습·분석 결과 저장</Text>
          </View>
          <Pressable style={styles.authBtnGhost} onPress={() => logout()}>
            <Text style={styles.authBtnGhostText}>로그아웃</Text>
          </Pressable>
        </View>
      ) : (
        <Link href="/login" asChild>
          <Pressable style={styles.authRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.authName}>게스트 모드</Text>
              <Text style={styles.authDesc}>로그인하면 최신 단어·문장 + 복습/분석 동기화</Text>
            </View>
            <View style={styles.authBtn}>
              <Text style={styles.authBtnText}>로그인</Text>
            </View>
          </Pressable>
        </Link>
      )}

      {/* ── 상단: 취약유형 분석 ── */}
      <View style={styles.analysisCard}>
        <View style={styles.analysisHeader}>
          <Text style={styles.analysisTitle}>😓 취약유형결과</Text>
          <Text style={styles.chevron}>›</Text>
        </View>

        <View style={styles.donutWrap}>
          <ScoreDonut
            avgScore={analysis?.avgScore ?? 0}
            targetScore={analysis?.targetScore ?? 900}
            segments={analysis?.segments ?? []}
          />
        </View>

        {!!analysis?.segments.length && (
          <View style={styles.legend}>
            {analysis.segments.map((s) => (
              <View key={s.label} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: s.color }]} />
                <Text style={styles.legendText}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {!analysis?.tested && (
          <Text style={styles.note}>* 분석결과는 테스트 완료 후 확인 가능합니다.</Text>
        )}
      </View>

      {/* ── 하단: 학습 카드 ── */}
      <Text style={styles.sectionTitle}>오늘의 학습</Text>
      <Link href="/learn/due" asChild>
        <Pressable style={StyleSheet.flatten([styles.card, styles.reviewCard])}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{due}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>복습 시작</Text>
            <Text style={styles.cardDesc}>복습 큐 {due}개 대기 중</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </Pressable>
      </Link>

      <Text style={styles.sectionTitle}>LC · 듣기</Text>
      <View style={styles.grid}>
        {LC_PARTS.map((p) => (
          <PartCard key={p.p} part={p} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>RC · 독해</Text>
      <View style={styles.grid}>
        {RC_PARTS.map((p) => (
          <PartCard key={p.p} part={p} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>문장쓰기 · 쉐도잉</Text>
      <View style={styles.grid}>
        {LC_PARTS.map((p) => (
          <Link key={p.p} href={`/write/${p.p}`} asChild>
            <Pressable style={StyleSheet.flatten([styles.gridCard, { backgroundColor: "#0ea5e9" }])}>
              <View style={styles.cardHead}>
                <Text style={styles.cardIcon}>✍️</Text>
                <Text style={styles.cardTitle}>{p.title}</Text>
              </View>
              <Text style={styles.cardDesc}>받아쓰기 · 쉐도잉</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

function PartCard({ part }: { part: Part }) {
  return (
    <Link href={`/learn/part-${part.p}`} asChild>
      <Pressable style={StyleSheet.flatten([styles.gridCard, { backgroundColor: part.color }])}>
        <View style={styles.cardHead}>
          <Text style={styles.cardIcon}>{part.icon}</Text>
          <Text style={styles.cardTitle}>{part.title}</Text>
        </View>
        <Text style={styles.cardDesc}>{part.desc}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  authRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  authName: { color: colors.text, fontSize: fontSize.md, fontWeight: "700" },
  authDesc: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  authBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  authBtnText: { color: "#ffffff", fontWeight: "800", fontSize: fontSize.sm },
  authBtnGhost: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  authBtnGhostText: { color: colors.textMuted, fontWeight: "700", fontSize: fontSize.sm },

  analysisCard: {
    backgroundColor: "#ffffff",
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    gap: spacing.sm,
  },
  analysisTitle: { fontSize: fontSize.lg, fontWeight: "800", color: "#1e3a8a" },
  chevron: { fontSize: fontSize.lg, color: "#94a3b8", fontWeight: "700" },
  donutWrap: { marginTop: spacing.md },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: "#475569", fontSize: fontSize.sm },
  note: { color: "#94a3b8", fontSize: fontSize.xs, marginTop: spacing.md, textAlign: "center" },

  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.xs,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  reviewCard: { backgroundColor: colors.accent },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#ffffff", fontWeight: "800", fontSize: fontSize.md },
  cardTitle: { color: "#ffffff", fontSize: fontSize.md, fontWeight: "800" },
  cardDesc: { color: "rgba(255,255,255,0.85)", fontSize: fontSize.sm, marginTop: 2 },
  cardArrow: { color: "#ffffff", fontSize: 24, fontWeight: "700" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridCard: {
    width: "47%",
    flexGrow: 1,
    minHeight: 88,
    padding: spacing.lg,
    borderRadius: radius.lg,
    justifyContent: "center",
    gap: spacing.xs,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardIcon: { fontSize: 22 },
});
