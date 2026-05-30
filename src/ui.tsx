import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from "react-native";
import { colors, fontSize, radius, spacing } from "./theme";

/** Centered full-screen container for loading/empty/error states. */
export function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

export function Loading() {
  return (
    <Centered>
      <ActivityIndicator color={colors.accent} />
    </Centered>
  );
}

export function EmptyView({ message }: { message: string }) {
  return (
    <Centered>
      <Text style={styles.muted}>{message}</Text>
    </Centered>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Centered>
      <Text style={styles.errorTitle}>문제가 발생했습니다</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry && (
        <PrimaryButton label="다시 시도" onPress={onRetry} style={{ marginTop: spacing.md }} />
      )}
    </Centered>
  );
}

export function PrimaryButton({
  label,
  busy,
  style,
  ...props
}: PressableProps & { label: string; busy?: boolean }) {
  return (
    <Pressable
      {...props}
      disabled={busy || props.disabled}
      style={[styles.btn, (busy || props.disabled) && styles.btnDisabled, style as object]}
    >
      <Text style={styles.btnText}>{busy ? "..." : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  muted: { color: colors.textMuted, fontSize: fontSize.md, textAlign: "center" },
  errorTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.bg, fontWeight: "700", fontSize: fontSize.base },
});
