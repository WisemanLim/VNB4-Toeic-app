import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/core/auth";
import { PrimaryButton } from "@/ui";
import { colors, radius, spacing, fontSize } from "@/theme";

export default function Signup() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (password.length < 8) {
      Alert.alert("비밀번호", "8자 이상 입력하세요.");
      return;
    }
    setBusy(true);
    try {
      await signup(email.trim(), password, name.trim() || undefined);
      router.replace("/");
    } catch (e) {
      Alert.alert("회원가입 실패", e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.shell}>
      <View style={styles.card}>
        <Text style={styles.brand}>VNB4 TOEIC · 회원가입</Text>

        <Text style={styles.label}>이름 (선택)</Text>
        <TextInput
          style={styles.input}
          placeholder="홍길동"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />

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

        <Text style={styles.label}>비밀번호 (8자 이상)</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <PrimaryButton label="회원가입" busy={busy} onPress={submit} style={{ marginTop: spacing.sm }} />

        <Text style={styles.sub}>가입 즉시 로그인되어 서버 데이터와 동기화됩니다.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl, justifyContent: "center" },
  card: {
    backgroundColor: colors.bgCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  brand: { color: colors.accent, fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.md },
  label: { color: colors.textMuted, fontSize: fontSize.sm, marginBottom: spacing.xs },
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
  sub: { color: colors.textMuted, textAlign: "center", marginTop: spacing.md, fontSize: fontSize.xs },
});
