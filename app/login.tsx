import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, Pressable } from "react-native";
import { useRouter, Link } from "expo-router";
import { useAuth } from "@/core/auth";
import { PrimaryButton } from "@/ui";
import { colors, radius, spacing, fontSize } from "@/theme";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (e) {
      Alert.alert("로그인 실패", e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.shell}>
      <View style={styles.card}>
        <Text style={styles.brand}>VNB4 TOEIC</Text>

        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="user@example.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <PrimaryButton
          label="로그인"
          busy={busy}
          onPress={submit}
          style={{ marginTop: spacing.sm }}
        />

        <Link href="/signup" asChild>
          <Pressable>
            <Text style={styles.link}>계정이 없으신가요? 회원가입</Text>
          </Pressable>
        </Link>

        <Text style={styles.sub}>로그인하면 서버의 최신 단어·문장과 복습·분석 결과가 동기화됩니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
    justifyContent: "center",
  },
  card: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  brand: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  link: {
    color: colors.accent,
    textAlign: "center",
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  sub: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    fontSize: fontSize.xs,
  },
});
