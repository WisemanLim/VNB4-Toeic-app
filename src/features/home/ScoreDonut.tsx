import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import type { AnalysisSegment } from "@/core/schemas";
import { fontSize } from "@/theme";

const SIZE = 220;
const STROKE = 34;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CIRC = 2 * Math.PI * R;
const TRACK = "#e2e8f0";
const INK = "#0f172a";
const INK_MUTED = "#64748b";
const ACCENT = "#3b82f6";

/** Segmented donut with centered avg/target score (reference: 취약유형결과). */
export function ScoreDonut({
  avgScore,
  targetScore,
  segments,
}: {
  avgScore: number;
  targetScore: number;
  segments: AnalysisSegment[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <G rotation={-90} originX={CX} originY={CX}>
          <Circle cx={CX} cy={CX} r={R} stroke={TRACK} strokeWidth={STROKE} fill="none" />
          {segments.map((seg) => {
            const len = (seg.value / total) * CIRC;
            const circle = (
              <Circle
                key={seg.label}
                cx={CX}
                cy={CX}
                r={R}
                stroke={seg.color}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={`${len} ${CIRC - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return circle;
          })}
        </G>
      </Svg>

      <View style={styles.center} pointerEvents="none">
        <Text style={styles.label}>내 평균 총점</Text>
        <Text style={styles.score}>
          {avgScore}
          <Text style={styles.unit}> 점</Text>
        </Text>
        <View style={styles.rule} />
        <Text style={styles.targetLabel}>목표점수</Text>
        <Text style={styles.target}>
          {targetScore}
          <Text style={styles.targetUnit}> 점</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center" },
  label: { color: INK_MUTED, fontSize: fontSize.sm },
  score: { color: ACCENT, fontSize: 36, fontWeight: "800" },
  unit: { color: ACCENT, fontSize: fontSize.md, fontWeight: "700" },
  rule: { width: 56, height: 1, backgroundColor: "#cbd5e1", marginVertical: 6 },
  targetLabel: { color: INK_MUTED, fontSize: fontSize.xs },
  target: { color: INK, fontSize: fontSize.lg, fontWeight: "800" },
  targetUnit: { color: INK, fontSize: fontSize.sm, fontWeight: "700" },
});
