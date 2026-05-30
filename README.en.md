# VNB4-Toeic-app

> 🌐 **Language / 언어**: **English** · [한국어](README.md)

TOEIC vocab mobile app — React Native 0.74 + Expo SDK 51.

## Stack
- Expo SDK 51 (MIT) + Expo Router 3 (file-based routing)
- TanStack Query 5, Zustand, Zod + React Hook Form
- expo-av (TTS), expo-secure-store (tokens), react-native-svg (donut chart)

## Screens (화면)

- **홈 (Home)** [`app/index.tsx`] — split into top/bottom halves.
  - Top: **취약유형결과 (weak-type analysis)** donut chart — guest (not yet studied) = empty gray track + "Check after test"; logged in = server analysis LC/RC **correct/incorrect 4-way split** — [`src/features/home/ScoreDonut.tsx`]
  - Bottom: review-start card + **LC (Part 1–4) / RC (Part 5–7)** two-section part grid (entering a card studies **all words** for that part) + **문장쓰기·쉐도잉 (sentence writing / shadowing)** section (Part 1–4). Guest/login auth bar at the top.
- **학습 카드 (Learning card)** [`app/learn/[lessonId].tsx`] — top illustration image (falls back to picsum if no `imageUrl` → server words always shown too) → POS (noun/verb…, free-string label map) → word + TTS → IPA / Korean pronunciation → locale chips (US/GB/AU) → (tap) meaning → example sentence (target bolded) + TTS → sentence translation. Bottom circular toolbar (previous / don't know / favorite / next).
- **문장쓰기·쉐도잉 (sentence writing / shadowing)** [`app/write/[part].tsx`] — Korean hint → pick word chips to complete the sentence → confirm → answer + full sentence 🔊 (shadowing). `useSentences(part)` → `/sentences`.
- **로그인 / 회원가입 (Login / Sign up)** [`app/login.tsx` · `app/signup.tsx`] — email + password. Home top auth bar (guest CTA ↔ user + logout). `AuthProvider` / `useAuth` in `src/core/auth.tsx`.

## PRD module mapping

| PRD area | Location |
|---|---|
| §1.3 Learning word card / IPA / Korean pronunciation / example / image | `app/learn/[lessonId].tsx` |
| §1.3 Multi-locale TTS playback (en-US/GB/AU) | same file + `src/features/learn/useTts.ts` |
| §1.3 SRS review queue | `app/index.tsx` review card → `/learn/due` |
| §1.3 Progress/stats (weak-type donut) | `app/index.tsx` + `src/features/home/ScoreDonut.tsx` (`/me/analysis`) |
| 문장쓰기 (sentence writing, word picking) / shadowing | `app/write/[part].tsx` (`/sentences`, Part 1–4) |
| Studying all words per part | `app/learn/part-N` → `useLearnQueue` paginates `/words?part=N` (all words, not a 20 limit) |
| §1.3 Notes / favorites | Learning card bookmark (local state, persistence in M5) |
| §1.3 Auth (Email + OAuth) | `app/login.tsx` |
| §2.1 Words per part (all parts offline) | `assets/seed/words.json` (scripts/gen-seed.mjs) |
| §7 Offline 24h cache | `app/_layout.tsx` TanStack Query `staleTime`/`gcTime` (implemented) |

---

## Architecture (src/)

```
src/
  core/
    config.ts     # environment: API_URL, USE_MOCK toggle
    client.ts     # fetch wrapper + token + mock routing + Zod validation
    schemas.ts    # Zod schemas = single source for API payloads. Server tolerance: part coercion ("P1"→1), nullable fields .nullish(), pos free string (non-standard values are safe)
    queries.ts    # TanStack Query hooks (useDueCount/useLearnQueue/useGradeWord/useAnalysis/useSentences/useLessons)
    seed.ts       # bundled all-parts seed loader (assets/seed/words.json + sentences.json)
    mocks.ts      # mock routing that works without a backend (seed first, inline fallback)
  features/
    home/ScoreDonut.tsx  # weak-type donut chart (react-native-svg)
    learn/useTts.ts      # expo-av playback hook
  ui.tsx          # shared components (Loading/Empty/Error/PrimaryButton)
  theme.ts        # design tokens
app/              # Expo Router screens (file-based routing)
assets/seed/words.json  # gen:seed output (committed, included in build)
scripts/gen-seed.mjs    # DB seed → app bundle converter
scripts/run.mjs         # emulator/simulator auto-boot launcher
```

**Guest / logged-in data source** — switched at runtime by auth state (`src/core/client.ts`):
- **Guest (not logged in)** → bundled seed + in-app mock for **offline operation** (full feature set without login).
- **Logged in** → real server (`API_URL`) for **latest words/sentences/lessons + review/analysis sync**. `/auth/*` always hits the server.
- Tokens: native = expo-secure-store, web = localStorage. On login the TanStack Query cache is invalidated to refetch server data.

**Server address (API_URL) = environment variable** — the base for login and all subsequent server requests. Switchable without code changes:
priority `EXPO_PUBLIC_API_URL` (env) → `app.json extra.apiUrl` → `localhost:4000`. Locally, copy [.env.example](.env.example)
(`cp .env.example .env`); per-environment (dev/preview/staging/production) lives in [eas.json](eas.json) `build.<profile>.env`.
For deployment server-address / mock caveats → **[PUBAPP.en.md](PUBAPP.en.md) §C+**. (Warns at startup if production points to localhost/private IP.)

**Forced mock mode** — when `EXPO_PUBLIC_USE_MOCK=1` (or app.json `extra.useMock`), all requests are handled by mock regardless of auth state (zero-backend store/offline demo). Production builds leave it unset.

**Offline all-parts seed** — `database/seeds/parts/part{1..7}.json` (excluding duplicate (part,word) →
**3,686 unique words**) is converted and deduped into the app's `Word` shape by [scripts/gen-seed.mjs](scripts/gen-seed.mjs) and
bundled as `assets/seed/words.json`. Sentence-writing `seeds/sentences/*.json` (**198 items**) is likewise bundled as `assets/seed/sentences.json`.
All-parts words + sentences ship inside the app even without a backend. Regenerate when the seed changes:

```bash
# auto-detects the default path (sibling repo), or specify VNB4_SEED_DIR
pnpm gen:seed
VNB4_SEED_DIR=/path/to/VNB4-Toeic-database/seeds/parts pnpm gen:seed
```

Part study (`/learn/part-N`) uses **all words of that part** (guest = bundled mock `/words`, logged in = server `/words` pagination — no 20 limit); the review queue samples the top 30 words; sentence writing has items per part.
If seed files are missing, it falls back to the inline 24 words in `mocks.ts` (the build always succeeds).

**Deployment / store** — for the full store-upload process (developer site → credential issuance → `eas submit`)
see **[PUBAPP.en.md](PUBAPP.en.md)**. Supplementary pipeline/metadata docs:
[.doc/deploy-EAS.md](.doc/deploy-EAS.md) · [.doc/store-metadata.md](.doc/store-metadata.md) · [eas.json](eas.json).

---

## 0. Prerequisites (per platform)

| Platform | Requires | Install command / guide |
|--------|------|---------------------|
| **Expo Go (real device, recommended)** | iPhone/Android phone + Expo Go app | Install "Expo Go" from the App Store / Play Store |
| **iOS simulator** | Xcode **full install** (CLT alone is not enough) | Install Xcode from the App Store → `xcode-select --install` |
| **Android emulator** | Android Studio + AVD + JDK 17 | https://developer.android.com/studio → create an AVD |
| **Web preview** | Node 20+ (already present) | No extra install needed (react-native-web included) |
| **EAS build (cloud)** | Expo account | `npx eas login` |

### Quick diagnostics
```bash
# whether Xcode is fully installed
xcrun simctl help >/dev/null 2>&1 && echo "iOS sim OK" || echo "Xcode 풀 설치 필요"

# Android Studio + AVD
adb devices                # device + emulator list
emulator -list-avds        # available AVDs

# Node version
node -v                    # v20+ recommended
```

---

## 1. Fastest run — Expo Go (no Xcode / Android Studio needed)

Just a phone, running on a real device within 5 minutes.

```bash
cd VNB4-Toeic-app
pnpm install
pnpm start
```
**Scan the printed QR code with your phone**:
- iOS: scan with the Camera app → Expo Go opens
- Android: use "Scan QR Code" inside the Expo Go app

> The phone and Mac must be on the **same Wi-Fi**. On different networks, use `pnpm start --tunnel` (ngrok-based, slow).

---

## 2. Run on the iOS simulator

Xcode full install required (Command Line Tools alone won't work).

```bash
pnpm ios            # auto-boots the simulator, then native build/run
pnpm ios:go         # auto-boots the simulator, then Expo Go (bypasses native compile)
# or
pnpm start  # then press i
```

`pnpm ios` ([scripts/run.mjs](scripts/run.mjs)) auto-boots an available iPhone
(`xcrun simctl boot` + `bootstatus` wait) if none is booted, then runs.

> ⚠️ Because of the parentheses in the current folder path (`Apps(Android,iOS,...)`), **`pnpm ios` (native build) fails** (§7).
> → Move to a path without parentheses, or use **`pnpm ios:go`** (Expo Go, works regardless of path).

When the error **"Xcode must be fully installed"** occurs:
1. Install Xcode from the App Store (≈15GB, 30 min+)
2. Launch it once after install to accept the license + download components
3. Switch the CLT path:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   xcodebuild -runFirstLaunchCheck
   xcrun simctl help    # ready when it prints normally
   ```

---

## 3. Run on the Android emulator

Android Studio + AVD required.

```bash
cd VNB4-Toeic-app
pnpm android        # auto-boots the emulator, then build/run
```

`pnpm android` ([scripts/run.mjs](scripts/run.mjs)) automatically:
1. Sets `ANDROID_HOME` (default `~/Library/Android/sdk`) + `JAVA_HOME` (Android Studio JBR)
2. Boots the first AVD (`emulator -list-avds`) and waits for boot completion if no device is running
3. Runs `expo run:android`

To manually launch a specific AVD:
```bash
emulator -avd Medium_Phone &     # your AVD name
adb devices                      # OK once a device line appears
pnpm android
```

When the error **"No Android connected device found"** occurs:
1. Install Android Studio (https://developer.android.com/studio)
2. Install SDK Platform 34 + Build-Tools from the SDK Manager
3. Create an emulator in the AVD Manager (Pixel recommended)
4. Environment variables (zsh):
   ```bash
   echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
   echo 'export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools' >> ~/.zshrc
   source ~/.zshrc
   ```
5. Confirm the name with `emulator -list-avds` then launch, verify recognition with `adb devices`
6. Run `pnpm android` again

When using a real device over USB: enable "Developer options → USB debugging" on the phone; it must show up in `adb devices`.

---

## 4. Web preview (browser)

```bash
pnpm web
```
Opens `http://localhost:8081`.

When the error **"react-native-web@~0.19.10, react-dom@18.2.0"** occurs:
The required deps are missing. This project includes them — if it recurs:
```bash
npx expo install react-native-web react-dom
```

> React Native components don't behave 100% identically on web. Testing mainly on simulator/real device is recommended.

---

## 5. EAS build (cloud, real IPA/APK)

```bash
npx eas-cli login            # first time only
npx eas-cli build --platform ios       # or android, all
npx eas-cli build --platform android
```

**Error "Nonexistent flag: --plaform"** → typo. The correct option is `--platform` (don't drop the l).

[eas.json](eas.json) includes development/preview/**staging**/production + submit profiles.
**For the full store-upload process (developer site → certificate / service-account issuance → `eas submit`), see [PUBAPP.en.md](PUBAPP.en.md).**
**Installing on a real device (without developer mode) — Expo Go / TestFlight detailed guide: [PUBAPP.en.md §G](PUBAPP.en.md).**

> ⚠️ Because of the parentheses in the parent folder path (`Apps(Android,iOS,...)`), **local** `expo run:ios` fails, but
> **EAS cloud builds are unaffected** (clean CI path). See the §7 error matrix.

---

## 6. Environment variables

`app.json` → `expo.extra.apiUrl` is the backend URL.
To use a different URL at runtime, prefix like `EXPO_PUBLIC_API_URL=https://api.example.com pnpm start`.

---

## 7. Common errors → action matrix

| Error message | Cause | Action |
|------------|------|------|
| `Unable to run simctl: xcrun simctl help exited with non-zero code: 72` | Only Xcode CLT installed | Full Xcode install → see §2 |
| `Xcode must be fully installed before you can continue. Continue to the App Store?` | Same | Install Xcode from the App Store |
| `It looks like you're trying to use web support but don't have the required dependencies` | `react-native-web` / `react-dom` not installed | `npx expo install react-native-web react-dom` |
| `No Android connected device found, and no emulators could be started automatically` | No AVD or ADB not recognized | See §3 (Android Studio + AVD) |
| `userInterfaceStyle: Install expo-system-ui in your project to enable this feature` | `expo-system-ui` not installed | `npx expo install expo-system-ui` (included in this project) |
| `Nonexistent flag: --plaform` | EAS CLI command typo | Use `--platform` (don't drop the l) |
| `Metro stuck on "Loading dependency graph"` | Corrupted cache | `pnpm start --clear` or `rm -rf node_modules .expo && pnpm install` |
| iOS `expo run:ios` → `[CP-User] Generate Specs` / `syntax error near unexpected token 'Android,iOS,...'` | **Parentheses/commas in the parent folder path** (`Apps(Android,iOS,...)`) break the `/bin/sh` of the RN Xcode script | Local native iOS builds require **moving/renaming to a path without parentheses** (e.g. `~/Developer/VNB4-Toeic-app`). Or use an EAS cloud build (CI path is unaffected). Expo Go runs are unaffected |
| Android `react-native-mmkv:compileDebugJavaWithJavac FAILED` / `cannot be converted to NativeModule` | mmkv 3.x needs the RN New Architecture; this project is RN 0.74 old-arch | It is an unused dependency, so **already removed**. If re-added, use `2.x` or enable the New Arch |
| Android emulator `App isn't 16 KB compatible` dialog | Android 15 16KB-page emulator image + RN 0.74 unaligned `.so` | Informational dev-time warning. The app runs fine in page-size compatibility mode. Tap "Don't Show Again". The store 16KB requirement will be addressed by a future RN upgrade |
| `Unable to resolve module ...` | Metro cache after a new package | Same — `--clear` |
| `ERR_PNPM_IGNORED_BUILDS: Ignored build scripts: ...` | pnpm 11 strict blocking policy | This project sets `dangerouslyAllowAllBuilds: true` in `pnpm-workspace.yaml` → if it newly appears, there may be a malformed `allowBuilds:` placeholder block in the yaml. Clean the yaml then re-run `rm -rf node_modules && pnpm install` |
| `allowBuilds:` block auto-written into `pnpm-workspace.yaml` | Exiting the interactive `pnpm approve-builds` command with an empty response | Manually delete the block. Keep only `dangerouslyAllowAllBuilds: true`. Never use the `approve-builds` command |

---

## 8. Command summary

```bash
pnpm install            # install dependencies
pnpm start              # Expo dev tools (QR + simulator shortcuts)
pnpm start --clear      # clear Metro cache then start
pnpm start --tunnel     # when connecting from another network / external phone
pnpm ios                # auto-boot simulator + iOS native build (needs a path without parentheses)
pnpm ios:go             # auto-boot simulator + Expo Go (path-independent)
pnpm android            # auto-boot emulator + Android native build
pnpm web                # browser
pnpm typecheck          # tsc --noEmit
pnpm lint               # eslint (legacy config, .eslintrc.js)
pnpm gen:seed           # DB all-parts seed → refresh the assets/seed/words.json bundle

# run with mock data, no backend
EXPO_PUBLIC_USE_MOCK=1 pnpm start
# when path parentheses block the local iOS native build — Expo Go (bypasses native compile)
EXPO_PUBLIC_USE_MOCK=1 pnpm exec expo start --ios --go
```

---

## 9. Why Expo (PRD §5.1)

Adopting the PRD's top recommendation. Simultaneous iOS/Android/web release + EAS build/OTA. Mature learning-card + audio library.

## 10. Why expo-av (not react-native-track-player)

Among the PRD §5.1 candidates, track-player is Apache-2.0 and supports lock-screen controls, but it's overkill for short vocab-memorization clips.
expo-av is zero-config + EAS-compatible + works in Expo Go. Swap to track-player if background playback/queue is needed.
