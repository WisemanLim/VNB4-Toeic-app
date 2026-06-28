import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { AuthProvider } from "@/core/auth";
import { colors } from "@/theme";

// Expo Router renders this for uncaught render errors in the tree.
export { ErrorBoundary } from "expo-router";

const ONE_DAY = 1000 * 60 * 60 * 24;

export default function RootLayout() {
  // PRD §7: offline 24h cache — keep data fresh/usable for a day.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: ONE_DAY, gcTime: ONE_DAY, retry: 1 },
        },
      }),
  );
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={client}>
          <AuthProvider>
            <StatusBar style="light" backgroundColor={colors.bg} />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bgCard },
                headerTintColor: colors.accent,
                headerTitleStyle: { fontWeight: "700", color: colors.text },
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="index" options={{ title: "TOEIC 단어암기" }} />
              <Stack.Screen name="login" options={{ title: "로그인" }} />
              <Stack.Screen name="signup" options={{ title: "회원가입" }} />
              <Stack.Screen name="learn/[lessonId]" options={{ title: "학습" }} />
              <Stack.Screen name="write/[part]" options={{ title: "문장쓰기 · 쉐도잉" }} />
              <Stack.Screen name="bookmarks" options={{ title: "북마크 모아보기" }} />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
