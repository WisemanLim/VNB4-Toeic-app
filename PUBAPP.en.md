# PUBAPP — Deployment Guide (iOS · Android · Web)

> 🌐 **Language / 언어**: **English** · [한국어](PUBAPP.md)

The complete process for building the VNB4 TOEIC app with EAS, publishing it to both stores
(iOS App Store · Google Play), and deploying the web build (Expo Web). Walks through everything
in order — from signing into the developer sites, issuing and registering credentials, filling in
the `eas.json` placeholders, to building, submitting, and web hosting.

- **App name** — VNB4 TOEIC
- **Bundle ID (iOS)** — `io.vnb4.toeic`
- **Package (Android)** — `io.vnb4.toeic`
- Related files — [eas.json](eas.json), [.doc/store-metadata.md](.doc/store-metadata.md), [.doc/deploy-EAS.md](.doc/deploy-EAS.md)

> ⚠️ Because of the parentheses in this repository's parent path `Apps(Android,iOS,...)`, running
> `expo run:ios` **locally** breaks. However, **EAS cloud builds run on a clean CI path, so they are
> unaffected.** You can proceed as-is.

---

## 0. Common Prerequisites (one-time)

```bash
# EAS CLI 설치 + 로그인
npm i -g eas-cli           # 또는 매번 npx eas-cli@latest
eas login                  # Expo 계정 (없으면 expo.dev 가입)
eas whoami                 # 로그인 확인

# 프로젝트를 Expo 계정에 연결 → app.json 에 extra.eas.projectId 기록됨
cd VNB4-Toeic-app
eas init
```

### Verify the versioning scheme

| Item | Location | Note |
|---|---|---|
| Display version | [app.json](app.json) `expo.version` (currently `0.1.0`) | Version shown in the store |
| iOS build number | EAS `autoIncrement` (production profile) | Auto +1 per submission |
| Android versionCode | EAS `autoIncrement` | Auto +1 per submission |

Because `eas.json` has `cli.appVersionSource: "remote"`, EAS manages the build numbers. On the first
build, just choose "manage remotely".

---

# A. iOS — App Store

## A-1. Confirm your Apple Developer membership

1. Go to https://developer.apple.com/account (sign in with your Apple ID).
2. Open **Membership details**.
3. Note down two values — they'll go into `eas.json` later:
   - **Team ID** (10 characters, e.g. `A1BCDE2FG3`) → `appleTeamId` in `eas.json`
   - Apple ID email → `appleId` in `eas.json`
4. Confirm the membership status is **Active** (the $99/yr payment is complete).

## A-2. Register the App ID (Identifier)

> EAS can auto-generate it at build time, but registering it in advance makes things clearer.

1. Go to https://developer.apple.com/account/resources/identifiers/list.
2. **+** → **App IDs** → select **App** → Continue.
3. Enter:
   - **Description** — `VNB4 TOEIC`
   - **Bundle ID** — Explicit → `io.vnb4.toeic`
4. Capabilities — the app currently needs no special entitlements. Keep the defaults.
   (When adding Push / Sign in with Apple later, check the boxes here.)
5. Continue → Register.

## A-3. Create the app in App Store Connect

1. https://appstoreconnect.apple.com → **My Apps** → **+** → **New App**.
2. Enter:
   - **Platform** — iOS
   - **Name** — `VNB4 토익 단어` (store display name, must be unique)
   - **Primary Language** — Korean
   - **Bundle ID** — select `io.vnb4.toeic` from the list
   - **SKU** — `vnb4-toeic-ios` (internal identifier, your choice)
   - **User Access** — Full Access
3. Create.
4. On the created app → **App Information** → **General Information**,
   note the **Apple ID** (10-digit number, e.g. `6478912345`) → `ascAppId` in `eas.json`.

## A-4. Code signing (EAS managed — recommended)

You don't need to create certificates/profiles yourself. On the first iOS build, EAS creates and stores them.

```bash
eas build --profile production --platform ios
```

Prompts during the process:
- "Generate a new Apple Distribution Certificate?" → **Yes**
- "Generate a new Apple Provisioning Profile?" → **Yes**
- When prompted to sign in to your Apple account, enter the Apple ID from A-1 (and the 2FA code).

EAS generates and stores the distribution certificate + App Store provisioning profile.
To review/back up later: `eas credentials` → iOS.

> To manage them yourself, you can upload an existing .p12 + .mobileprovision via `eas credentials`.

## A-5. Fill in the `eas.json` placeholders (iOS)

Replace the 3 values in [eas.json](eas.json) `submit.production.ios` with the values gathered above:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",   // A-1
      "ascAppId": "6478912345",                 // A-3 (App Store Connect Apple ID)
      "appleTeamId": "A1BCDE2FG3"               // A-1 (Team ID)
    }
  }
}
```

## A-6. Build → Submit → TestFlight → Review

```bash
# 1) 프로덕션 IPA 빌드 (A-4 에서 이미 했으면 생략 가능)
eas build --profile production --platform ios

# 2) App Store Connect 로 업로드
eas submit --profile production --platform ios --latest
```

What `eas submit` asks:
- "What would you like to submit?" → select the build you just made (automatic with `--latest`).
- An App Store Connect **API Key** is recommended — without one, your Apple ID/password also works.
  (Issuing an API Key: App Store Connect → Users and Access → **Integrations / Keys** →
   App Store Connect API → **+** → Access: App Manager → download the .p8 + Key ID + Issuer ID.
   Once registered with EAS, it's reused.)

After upload:
1. App Store Connect → app → **TestFlight** tab, wait for processing (10–30 min, "Processing").
2. After processing completes, add internal testers → verify on a real device.
3. Store release: **App Store** tab → version → enter metadata
   (copy-paste from [.doc/store-metadata.md](.doc/store-metadata.md)) → upload screenshots →
   select the build → **Add for Review** → **Submit for Review**.

### Required fields before iOS submission (review will be rejected without them)

- Screenshots: at least one set of 6.7" (1290×2796) + 6.5"
- Privacy policy URL
- App Privacy questionnaire (collected data — declare "Contact Info" if using login email)
- Age rating questionnaire (4+)

---

# B. Android — Google Play

## B-1. Sign in to Play Console + create the app

1. Go to https://play.google.com/console (sign in with your developer account, $25 one-time payment complete).
2. **Create app**:
   - **App name** — `VNB4 토익 단어`
   - **Default language** — Korean (ko-KR)
   - **App or game** — App
   - **Free or paid** — Free
   - Check the declaration agreements → Create app.

## B-2. Register the package name

The package name `io.vnb4.toeic` is **finalized automatically on the first AAB upload**. No separate
pre-registration is needed. (Once uploaded, it cannot be changed — confirm in [app.json](app.json) that
it's `io.vnb4.toeic`.)

## B-3. Play App Signing + upload key (EAS managed — recommended)

Google Play manages the final signing via **Play App Signing**. The developer only manages the "upload key".
EAS generates and stores the upload keystore:

```bash
eas build --profile production --platform android
```

- "Generate a new Android Keystore?" → **Yes**.
- EAS generates and stores the keystore. **Be sure to back it up**: `eas credentials` → Android →
  Download. (If lost, you can't update the app — you'd have to request a reset from Google.)

When you upload the first AAB to Play Console, Play App Signing is enabled automatically.

## B-4. Issue a service account JSON (for eas submit automation)

For `eas submit` to upload via the Play API, a service account key is required.

1. **Play Console** → bottom-left **Setup** → **API access**.
2. "Choose a project to link" — link an existing Google Cloud project or create a new one.
3. **Service accounts** section → **Create new service account** → click the Google Cloud Console link.
4. Google Cloud Console:
   - **CREATE SERVICE ACCOUNT** → name it `eas-play-publisher` → Create.
   - You can skip the role here → Done.
   - The created service account → **Keys** tab → **Add Key** → **Create new key** → **JSON** → download.
   - Save this JSON file to the project root as `play-service-account.json`.
     **(Never commit it to git — add it to `.gitignore`.)**
5. Back in Play Console → API access → **Grant access** to the service account you just created:
   - **App permissions** — add the VNB4 토익 단어 app
   - **Account permissions** — check the **Release**-related (Release manager) permission → Invite/Apply.

```bash
echo "play-service-account.json" >> .gitignore
```

## B-5. Verify the `eas.json` placeholders (Android)

[eas.json](eas.json) `submit.production.android` — already configured; just make sure the path is correct:

```json
"android": {
  "serviceAccountKeyPath": "./play-service-account.json",
  "track": "internal"      // internal → 검증 후 production 으로 승격
}
```

## B-6. Build → Submit → Internal testing → Release

```bash
# 1) 프로덕션 AAB 빌드 (B-3 에서 했으면 생략)
eas build --profile production --platform android

# 2) Play Console internal track 으로 업로드
eas submit --profile production --platform android --latest
```

> ⚠️ Google Play policy: the **first upload often has to be manual**.
> If `eas submit` throws an "App not found / draft" error, upload just the first AAB manually
> in Play Console: app → **Testing → Internal testing → Create new release** →
> drag the AAB (download the .aab from the EAS build page) → Review → Rollout.
> From subsequent builds onward, `eas submit` automation works.

Release steps:
1. Add testers (emails) to the **Internal testing** track → verify installation via the link.
2. Write the **Store listing** (copy-paste from [.doc/store-metadata.md](.doc/store-metadata.md)) — short description,
   full description, icon 512×512, feature graphic 1024×500, phone screenshots ≥2.
3. Complete all the **App content** questionnaires (privacy policy URL, data safety, ads, target age, content rating).
4. **Production** track → Create release → submit for review → review (hours to days).

---

## C. Credential values — where to find them (summary table)

| Value | `eas.json` key | Source |
|---|---|---|
| Apple ID email | `submit.production.ios.appleId` | Your Apple account |
| App Store Connect Apple ID (numeric) | `submit.production.ios.ascAppId` | App Store Connect → App Information → General → Apple ID |
| Apple Team ID | `submit.production.ios.appleTeamId` | developer.apple.com → Membership details |
| iOS distribution certificate/profile | (stored by EAS) | auto-generated by `eas credentials` |
| Play service account JSON | `submit.production.android.serviceAccountKeyPath` | Google Cloud Console → service account → Keys → JSON |
| Android upload keystore | (stored by EAS) | auto-generated by `eas credentials` |

---

## C+. Managing environment variables / server address (API_URL) ⚠️ Deployment essential

The app's **login and all server requests after login** (syncing words, sentences, reviews, analytics)
go out to a single base URL `API_URL`. Because the server target differs per environment, you change it
**via environment variables, with no code changes**.

**Priority** (`src/core/config.ts`): `EXPO_PUBLIC_API_URL` (env) → `app.json` `extra.apiUrl` → `http://localhost:4000`.

**Data source rules** (`src/core/client.ts`):
- **Guest (not logged in)** = bundled seed + in-app mock → zero network, works offline.
- **Logged in** = `API_URL` real-server sync. `/auth/*` always hits the server.
- `EXPO_PUBLIC_USE_MOCK=1` = everything is mock regardless of auth (zero-backend demo) — **production must leave this unset/0**.

**Per-environment configuration location** (`eas.json` `build.<profile>.env`):

| Profile | `EXPO_PUBLIC_API_URL` | `EXPO_PUBLIC_USE_MOCK` | Purpose |
|---|---|---|---|
| `development` | (unset → localhost) | `1` | dev client, offline mock |
| `preview` | (unset) | `1` | internal demo build (no backend needed) |
| `staging` | `https://staging-api.vnb4.io` | (unset) | internal test with real-server integration |
| `production` | `https://api.vnb4.io` ← **replace with the real domain** | (unset) | store release |

```bash
# 로컬 개발 (.env — 커밋 금지, .env.example 복사)
cp .env.example .env            # EXPO_PUBLIC_API_URL 수정
# 안드로이드 에뮬레이터는 10.0.2.2, 실기기는 머신 LAN IP 사용
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000 pnpm android
EXPO_PUBLIC_API_URL=http://192.168.0.10:4000 pnpm ios   # 실기기

# 빌드 시 프로파일 env 가 자동 주입됨
eas build --profile staging   --platform all
eas build --profile production --platform all
```

**Notes**
- `EXPO_PUBLIC_*` is **baked into the bundle at build time** (cannot change at runtime). When the server changes, you need a **rebuild or OTA (`eas update`)**.
- If a production build points to localhost / a private IP / `http://`, the app emits a `console.warn` at startup (to prevent login/sync failures). Always use a public **HTTPS** endpoint.
- The backend **CORS** must allow the web app origin (NestJS `cors:true`).
- Token storage: native = expo-secure-store, web = localStorage (branched automatically).

---

## D. Pre-release checklist

- [ ] Bump `app.json` `expo.version` (e.g. `0.1.0` → `1.0.0`)
- [ ] Set the `production` profile's `EXPO_PUBLIC_API_URL` to the real backend HTTPS (currently the `https://api.vnb4.io` placeholder — mock disabled) — see C+
- [ ] Confirm `EXPO_PUBLIC_USE_MOCK` is **absent** from `production`/`staging` (if present, everything is mock)
- [ ] Real icon/splash assets ([assets/](assets/), `app.json`)
- [ ] iOS: screenshots + privacy policy URL + App Privacy questionnaire
- [ ] Android: screenshots + feature graphic + all App content questionnaires completed
- [ ] Confirm `play-service-account.json` is registered in `.gitignore`
- [ ] Back up EAS credentials (`eas credentials` → download, both platforms)

---

## E. OTA updates (when only JS changes — no review needed)

```bash
eas update --branch production --message "문구 수정"
```

JS/asset changes apply instantly without store review. However, **native changes** (new native modules,
added permissions, SDK upgrades) require `eas build` + resubmission.

---

## F. Common sticking points

| Symptom | Cause | Action |
|---|---|---|
| `eas submit` iOS "Invalid App Store Connect API key" | API Key not registered/expired | App Store Connect → Integrations → Keys, reissue then re-register via `eas credentials` |
| `eas submit` Android "The caller does not have permission" | Insufficient service account permissions | Play Console → API access → grant the service account Release permission (B-4 step 5) |
| Android "Package not found" / draft | First upload must be manual | Upload just the first AAB manually in Play Console (B-6 warning) |
| iOS "Missing compliance" | Export regulations not answered | App Store Connect build → Export Compliance → select "No" (no encryption used) |
| iOS build "No bundle identifier" | App ID not registered | Re-check A-2 |
| Android 16KB warning | RN 0.74 unaligned .so | No problem for release. OK until Play enforces 16KB. Upgrade RN later |

---

## G. Installing on a real device — without Developer Mode

Three ways to get it onto a real device. **Developer Mode is only needed for directly installing dev/ad-hoc
builds** — Expo Go and TestFlight go through the normal App Store path, so Developer Mode is not needed.

| Method | Developer Mode | Apple account ($99) | Review | Purpose |
|---|---|---|---|---|
| **Expo Go** | ❌ not needed | ❌ not needed | ❌ | Instant on-device check during development (same WiFi) |
| **TestFlight internal** | ❌ not needed | ✅ needed | ❌ (internal, 100 people) | Beta distribution · QA |
| **TestFlight external** | ❌ not needed | ✅ needed | ⚠ one-time beta review | Up to 10,000 external testers |
| (ref) Direct install of EAS dev build | ✅ **needed** | ✅ needed (UDID registration) | ❌ | Native debugging |

### G-1. Expo Go (for development, fastest)

The app has no `expo-dev-client` plugin, so it runs directly in Expo Go.

1. Connect your iPhone to the **same WiFi** as your development PC.
2. Install **Expo Go** from the App Store.
3. Start the dev server from the app folder (a real device uses the PC's LAN IP — not `localhost`):
   ```bash
   EXPO_PUBLIC_API_URL=http://<PC-LAN-IP>:4000 pnpm start
   # 예: EXPO_PUBLIC_API_URL=http://172.30.1.65:4000 pnpm start
   ```
4. Scan the terminal QR with the **Camera** (auto-opens Expo Go) → or Expo Go → "Enter URL manually" → `exp://<PC-LAN-IP>:8081`.
5. Both guest (offline) and login (server sync) work on the device. The backend must also be on the same LAN (`:4000`) for login to work.

> Limitation: the dev PC must be on and on the same network. Not a standalone install (it runs inside Expo Go).

### G-2. TestFlight (closest to a real release, no Developer Mode needed)

**Prerequisites**: Apple Developer membership ($99) + app created in App Store Connect (§A-1~A-3) + `eas.json` `submit.production.ios` placeholders filled in (§A-5).

1. **Build (confirm the server address is injected)** — first confirm the `production` (or `staging`) profile's `EXPO_PUBLIC_API_URL` is the real HTTPS backend (§C+):
   ```bash
   eas build --profile production --platform ios
   ```
2. **Upload**:
   ```bash
   eas submit --profile production --platform ios --latest
   ```
3. App Store Connect → app → **TestFlight** tab → wait for the build to finish "Processing" (10–30 min).
4. After processing, answer **Export Compliance** (no encryption used → "No").
5. **Internal testers (no review, instant)**:
   - TestFlight → **Internal Testing** → create a group → add App Store Connect users (team members, up to 100) by Apple ID → assign the build.
6. **External testers (up to 10,000, one-time beta review)**:
   - TestFlight → **External Testing** → create a group → add tester emails or create a **public link** → "Submit for Beta Review" on the build (usually a few hours to 1 day).
7. **Install on the device (tester)**:
   - Install the **TestFlight** app from the App Store → **Redeem** the invite email / public link → **Install** inside TestFlight → the app is installed on the home screen (no Developer Mode needed).
8. **Updating the build**: a new `eas build` + `eas submit` → TestFlight automatically notifies of the new build. If only JS changed, update without review via §E OTA (`eas update`).

> Expiry: a TestFlight build is valid for **90 days** after upload. Uploading a new build refreshes it.

### G-3. (Alternative) Direct install of an EAS dev build — Developer Mode required

Only when you need native debugging. Because this repo has parentheses in its parent path
(`Apps(Android,iOS,...)`), the **local `expo run:ios` native build fails** → you must use EAS cloud builds.

1. Device: Settings → Privacy & Security → **turn on Developer Mode** → reboot.
2. Register the UDID: `eas device:create` (enter the device UDID or use the registration link).
3. Build with a device-specific profile (the current `development` profile is for the simulator since it has `ios.simulator:true`):
   ```bash
   # eas.json 에 simulator:false 인 device 프로파일 추가 후
   eas build --profile <device-profile> --platform ios
   eas build:run -p ios --latest    # 연결된 기기에 설치
   ```

---

## H. Web deployment (Expo Web → static hosting)

Host the static bundle built with RN-web anywhere — Netlify/Vercel/Cloudflare Pages/S3, etc. No store review.

### H-1. Static build

```bash
# 서버 주소를 실 백엔드로 주입해서 export (로그인+동기화가 이 주소로 나감)
EXPO_PUBLIC_API_URL=https://api.vnb4.io pnpm exec expo export --platform web
# 산출물: dist/  (정적 HTML/JS/CSS)
```

> `EXPO_PUBLIC_*` is **baked in at build time** (§C+). If the server address changes, re-export. Guest = offline mock, logged in = this API_URL.

### H-2. Hosting (pick one)

```bash
# Netlify
npx netlify-cli deploy --dir dist --prod
# Vercel
npx vercel deploy dist --prod
# Cloudflare Pages
npx wrangler pages deploy dist
# 단순 정적 서버(자체 호스팅)
npx serve dist
```

### H-3. SPA routing + notes

- expo-router web is an SPA → on the host, configure a **fallback (rewrite) of all routes to `index.html`**.
  - Netlify: `/* /index.html 200` in `dist/_redirects`.
  - Vercel: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` in `vercel.json`.
- **CORS**: the backend (NestJS `cors:true`) must allow the web origin for login/sync to work. For production, explicitly listing allowed origins is recommended.
- **HTTPS required**: both the deployment domain and the API must be HTTPS (to avoid mixed-content blocking).
- Tokens: web stores them in `localStorage` (native uses SecureStore) — branched automatically.
- The admin web (`VNB4-Toeic-frontend`) is a separate app (Next.js). This section covers deploying the **web version of the learner app** (Expo Web).

### H-4. Quick check

```bash
pnpm exec serve dist      # 로컬에서 export 결과 확인
# → http://localhost:3000 게스트 홈/학습/문장쓰기 + 로그인 동기화 점검
```
