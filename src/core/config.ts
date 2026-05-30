import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

/**
 * Backend base URL — controls the LOGIN endpoint and ALL post-login server
 * requests (words/sentences/progress/analysis). Resolution order:
 *   1) EXPO_PUBLIC_API_URL   — env var, set per EAS build profile (eas.json) or .env
 *   2) app.json extra.apiUrl — committed default
 *   3) http://localhost:4000 — bare local fallback
 *
 * Change the server target by setting EXPO_PUBLIC_API_URL — no code change needed.
 * Local device/emulator testing: point at your machine's LAN IP (http://192.168.x.x:4000),
 * not localhost (emulator localhost ≠ host). See PUBAPP.md "환경변수 / 서버 주소".
 */
export const API_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ??
  (extra.apiUrl as string | undefined) ??
  "http://localhost:4000";

/** Build/runtime environment label (informational): development | preview | production. */
export const APP_ENV =
  (process.env.EXPO_PUBLIC_ENV as string | undefined) ??
  (extra.env as string | undefined) ??
  (__DEV__ ? "development" : "production");

/**
 * Force the in-app mock backend for ALL requests (zero-backend store/offline demo).
 * Enabled only by `EXPO_PUBLIC_USE_MOCK=1` or app.json `extra.useMock`.
 *
 * The data source is otherwise chosen at runtime by auth state (see client.ts):
 * a guest uses bundled mock data offline, a logged-in user syncs from API_URL, and
 * `/auth/*` always hits the server. `USE_MOCK` only forces the fully-offline path.
 */
export const USE_MOCK =
  process.env.EXPO_PUBLIC_USE_MOCK === "1" || extra.useMock === true;

// Guard against shipping a release that points at a local dev server (login + all
// synced data would fail on real devices). Logged at startup; no crash.
const isLocalApi = /localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|^http:\/\//.test(API_URL);
if (!__DEV__ && !USE_MOCK && isLocalApi) {
  // eslint-disable-next-line no-console
  console.warn(
    `[config] Release build points at a non-public API_URL (${API_URL}). ` +
      `Set EXPO_PUBLIC_API_URL to your production HTTPS endpoint in eas.json.`,
  );
}
