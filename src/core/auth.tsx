import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { View, ActivityIndicator } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { colors } from "../theme";
import { api, loadToken, saveToken, setAuthed } from "./client";
import { LoginResponseSchema, SessionUserSchema, type SessionUser } from "./schemas";

type Status = "loading" | "guest" | "authed";

interface AuthContextValue {
  status: Status;
  user: SessionUser | null;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);

  // Switching data source (guest mock ↔ server) means cached query data is stale.
  const refreshAll = useCallback(() => qc.invalidateQueries(), [qc]);

  // Boot: restore a saved session and validate it against the server.
  useEffect(() => {
    let alive = true;
    (async () => {
      const token = await loadToken();
      if (!token) {
        if (alive) setStatus("guest");
        return;
      }
      setAuthed(true);
      try {
        const me = await api("/users/me", { schema: SessionUserSchema });
        if (!alive) return;
        setUser(me);
        setStatus("authed");
      } catch {
        // Invalid/expired token → drop back to guest.
        await saveToken(null);
        if (alive) setStatus("guest");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api("/auth/login/email", {
        method: "POST",
        json: { email, password },
        schema: LoginResponseSchema,
      });
      await saveToken(res.accessToken); // sets authed=true
      setUser(res.user ?? { id: "me", email, role: "user", name: null });
      setStatus("authed");
      await refreshAll();
    },
    [refreshAll],
  );

  const signup = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await api("/auth/signup/email", {
        method: "POST",
        json: { email, password, name },
        schema: LoginResponseSchema,
      });
      await saveToken(res.accessToken);
      setUser(res.user ?? { id: "me", email, role: "user", name: name ?? null });
      setStatus("authed");
      await refreshAll();
    },
    [refreshAll],
  );

  const logout = useCallback(async () => {
    await saveToken(null); // sets authed=false
    setUser(null);
    setStatus("guest");
    await refreshAll();
  }, [refreshAll]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, isAuthed: status === "authed", login, signup, logout }),
    [status, user, login, signup, logout],
  );

  // Gate the tree until the session is resolved — otherwise data queries can
  // fire while `authed` is still false (race) and fetch the wrong source.
  if (status === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
