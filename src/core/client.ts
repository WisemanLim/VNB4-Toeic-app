import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { ZodType, infer as ZodInfer } from "zod";
import { API_URL, USE_MOCK } from "./config";
import { resolveMock } from "./mocks";

// expo-secure-store has no web backend → use localStorage on web, SecureStore on native.
const tokenStore = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      try {
        return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string | null): Promise<void> {
    if (Platform.OS === "web") {
      try {
        if (typeof localStorage === "undefined") return;
        if (value) localStorage.setItem(key, value);
        else localStorage.removeItem(key);
      } catch {
        /* storage blocked — session lives in memory only */
      }
      return;
    }
    if (value) await SecureStore.setItemAsync(key, value);
    else await SecureStore.deleteItemAsync(key);
  },
};

let accessToken: string | null = null;

// Runtime data-source switch:
//   guest (not authed) → in-app mock/offline bundled data (no network needed)
//   authed (logged in) → real backend (synced words/sentences/analysis/progress)
//   /auth/* endpoints   → always the real server (so login/signup authenticate)
//   USE_MOCK (forced)   → everything mock (zero-backend store/offline demo)
let authed = false;
export function setAuthed(v: boolean) {
  authed = v;
}
export function isAuthed() {
  return authed;
}

export async function loadToken() {
  accessToken = await tokenStore.get("accessToken");
  authed = !!accessToken;
  return accessToken;
}

export async function saveToken(token: string | null) {
  accessToken = token;
  authed = !!token;
  await tokenStore.set("accessToken", token);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public payload: unknown,
  ) {
    super(
      (payload as { message?: string } | null)?.message ?? `HTTP ${status}`,
    );
    this.name = "ApiError";
  }
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
}

// With a schema, the return type is inferred from it.
export async function api<S extends ZodType<unknown>>(
  path: string,
  init: ApiOptions & { schema: S },
): Promise<ZodInfer<S>>;
// Without a schema, the caller specifies the type (defaults to unknown).
export async function api<T = unknown>(path: string, init?: ApiOptions): Promise<T>;
export async function api(
  path: string,
  init: ApiOptions & { schema?: ZodType<unknown> } = {},
): Promise<unknown> {
  const method = init.method ?? "GET";
  const { schema } = init;

  let payload: unknown;

  const isAuthEndpoint = path.startsWith("/auth/");
  const useServer = !USE_MOCK && (authed || isAuthEndpoint);

  if (!useServer) {
    const mocked = resolveMock(path, method);
    if (mocked === null) throw new ApiError(404, { message: `No mock for ${method} ${path}` });
    payload = mocked;
  } else {
    if (!accessToken) await loadToken();
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(init.headers as Record<string, string>),
    };
    if (accessToken) headers["authorization"] = `Bearer ${accessToken}`;

    const res = await fetch(`${API_URL}/api/v1${path}`, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : undefined,
    });
    const text = await res.text();
    payload = text ? JSON.parse(text) : null;
    if (!res.ok) throw new ApiError(res.status, payload);
  }

  return schema ? schema.parse(payload) : payload;
}
