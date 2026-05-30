# VNB4-Toeic-app

> 🌐 **언어 / Language**: **한국어** · [English](README.en.md)

TOEIC vocab 모바일 앱 — React Native 0.74 + Expo SDK 51.

## Stack
- Expo SDK 51 (MIT) + Expo Router 3 (파일 기반 라우팅)
- TanStack Query 5, Zustand, Zod + React Hook Form
- expo-av (TTS), expo-secure-store (토큰), react-native-svg (도넛 차트)

## 화면 (Screens)

- **홈** [`app/index.tsx`] — 상/하 2분할.
  - 상단: **취약유형결과** 도넛 차트 — 게스트(미학습)=빈 회색 트랙 + "테스트 후 확인", 로그인=서버 분석 LC/RC **정답·오답 4분할** — [`src/features/home/ScoreDonut.tsx`]
  - 하단: 복습 시작 카드 + **LC(Part 1–4) / RC(Part 5–7)** 2섹션 파트 그리드(카드 진입 시 해당 파트 **전체 단어** 학습) + **문장쓰기·쉐도잉** 섹션(Part 1–4). 상단에 게스트/로그인 인증 바.
- **학습 카드** [`app/learn/[lessonId].tsx`] — 상단 일러스트 이미지(`imageUrl` 없으면 picsum 폴백 → 서버 단어도 항상 표시) → POS(명사/동사…, 자유 문자열 라벨맵) → 단어+TTS → IPA·한글발음 → 로케일 칩(US/GB/AU) → (탭) 뜻 → 예문(타겟 굵게)+TTS → 예문번역. 하단 원형 툴바(이전/모름/즐겨찾기/다음).
- **문장쓰기·쉐도잉** [`app/write/[part].tsx`] — 한글 힌트 → 단어칩 골라 문장 완성 → 확인 → 정답 + 전체문장 🔊(쉐도잉). `useSentences(part)` → `/sentences`.
- **로그인 / 회원가입** [`app/login.tsx` · `app/signup.tsx`] — 이메일+비밀번호. 홈 상단 인증 바(게스트 CTA ↔ 사용자+로그아웃). `src/core/auth.tsx` 의 `AuthProvider`/`useAuth`.

## PRD module mapping

| PRD 영역 | 위치 |
|---|---|
| §1.3 학습 단어카드 / IPA / 한글발음 / 예문 / 그림 | `app/learn/[lessonId].tsx` |
| §1.3 다국적 TTS 재생 (en-US/GB/AU) | 동일 파일 + `src/features/learn/useTts.ts` |
| §1.3 SRS 복습큐 | `app/index.tsx` 복습 카드 → `/learn/due` |
| §1.3 진도/통계 (취약유형 도넛) | `app/index.tsx` + `src/features/home/ScoreDonut.tsx` (`/me/analysis`) |
| 문장쓰기(단어 고르기)·쉐도잉 | `app/write/[part].tsx` (`/sentences`, Part 1–4) |
| 파트별 전체 단어 학습 | `app/learn/part-N` → `useLearnQueue` 가 `/words?part=N` 페이지네이션(전체 단어, 20 제한 아님) |
| §1.3 노트/즐겨찾기 | 학습 카드 북마크 (로컬 state, 영속화 M5) |
| §1.3 인증 (Email + OAuth) | `app/login.tsx` |
| §2.1 파트별 단어 (오프라인 전 파트) | `assets/seed/words.json` (scripts/gen-seed.mjs) |
| §7 오프라인 24h 캐시 | `app/_layout.tsx` TanStack Query `staleTime`/`gcTime` (구현됨) |

---

## 아키텍처 (src/)

```
src/
  core/
    config.ts     # 환경: API_URL, USE_MOCK 토글
    client.ts     # fetch 래퍼 + 토큰 + 목 라우팅 + Zod 검증
    schemas.ts    # Zod 스키마 = API 페이로드 단일 소스. 서버 관용화: part 코어션("P1"→1), nullable 필드 .nullish(), pos 자유 문자열(미표준값 안전)
    queries.ts    # TanStack Query 훅 (useDueCount/useLearnQueue/useGradeWord/useAnalysis/useSentences/useLessons)
    seed.ts       # 번들된 전 파트 시드 로더 (assets/seed/words.json + sentences.json)
    mocks.ts      # 백엔드 없이 동작하는 목 라우팅 (시드 우선, 인라인 폴백)
  features/
    home/ScoreDonut.tsx  # 취약유형 도넛 차트 (react-native-svg)
    learn/useTts.ts      # expo-av 재생 훅
  ui.tsx          # 공용 컴포넌트 (Loading/Empty/Error/PrimaryButton)
  theme.ts        # 디자인 토큰
app/              # Expo Router 화면 (파일 기반 라우팅)
assets/seed/words.json  # gen:seed 산출물 (커밋, 빌드에 포함)
scripts/gen-seed.mjs    # DB 시드 → 앱 번들 변환기
scripts/run.mjs         # 에뮬레이터/시뮬레이터 자동 부팅 런처
```

**게스트 / 로그인 데이터 소스** — 런타임에 인증 상태로 전환(`src/core/client.ts`):
- **게스트(미로그인)** → 번들 시드 + in-app mock 으로 **오프라인 동작**(로그인 없이 전 기능 사용).
- **로그인** → 실서버(`API_URL`)에서 **최신 단어·문장·레슨 + 복습/분석 동기화**. `/auth/*` 는 항상 서버.
- 토큰은 native=expo-secure-store, web=localStorage. 로그인 시 TanStack Query 캐시 무효화로 서버 데이터 refetch.

**서버 주소(API_URL) = 환경변수** — 로그인+이후 모든 서버 요청의 base. 코드 변경 없이 전환:
우선순위 `EXPO_PUBLIC_API_URL`(env) → `app.json extra.apiUrl` → `localhost:4000`. 로컬은 [.env.example](.env.example)
복사(`cp .env.example .env`), 환경별(dev/preview/staging/production)은 [eas.json](eas.json) `build.<profile>.env`.
배포 시 서버 주소·mock 유의사항 → **[PUBAPP.md](PUBAPP.md) §C+**. (프로덕션이 localhost/사설IP면 시작 시 경고)

**강제 목(mock) 모드** — `EXPO_PUBLIC_USE_MOCK=1`(또는 app.json `extra.useMock`) 이면 인증 상태와 무관하게
모든 요청을 mock 으로 처리(백엔드 0인 스토어/오프라인 데모). 프로덕션 빌드는 미설정.

**오프라인 전 파트 시드** — `database/seeds/parts/part{1..7}.json` (중복 (part,word) 제외 →
**고유 3,686단어**)을 [scripts/gen-seed.mjs](scripts/gen-seed.mjs) 가 앱 `Word` 형태로 변환·dedupe 해
`assets/seed/words.json` 으로 번들. 문장쓰기 `seeds/sentences/*.json`(**198문항**)도 `assets/seed/sentences.json`
으로 번들. 백엔드 없이도 전 파트 단어 + 문장이 앱에 포함되어 배포됨. 시드 변경 시 갱신:

```bash
# 기본 경로(형제 레포) 자동 탐지, 또는 VNB4_SEED_DIR 지정
pnpm gen:seed
VNB4_SEED_DIR=/path/to/VNB4-Toeic-database/seeds/parts pnpm gen:seed
```

파트 학습(`/learn/part-N`)은 **해당 파트 전체 단어**(게스트=번들 mock `/words`, 로그인=서버 `/words` 페이지네이션 — 20 제한 없음), 복습 큐는 상위 30단어 샘플, 문장쓰기는 part별 문항.
시드 파일이 없으면 `mocks.ts` 의 인라인 24단어로 폴백(빌드는 항상 성공).

**배포/스토어** — 스토어 업로드 전 과정(개발자 사이트 → 자격증명 발급 → `eas submit`)은
**[PUBAPP.md](PUBAPP.md)** 참고. 파이프라인/메타데이터 보조 문서:
[.doc/deploy-EAS.md](.doc/deploy-EAS.md) · [.doc/store-metadata.md](.doc/store-metadata.md) · [eas.json](eas.json).

---

## 0. Prerequisites (플랫폼별)

| 플랫폼 | 필요 | 설치 명령 / 가이드 |
|--------|------|---------------------|
| **Expo Go (실기기, 권장)** | iPhone/Android 폰 + Expo Go 앱 | App Store / Play Store 에서 "Expo Go" 설치 |
| **iOS 시뮬레이터** | Xcode **풀 설치** (CLT 만으론 불가) | App Store 에서 Xcode 설치 → `xcode-select --install` |
| **Android 에뮬레이터** | Android Studio + AVD + JDK 17 | https://developer.android.com/studio → AVD 생성 |
| **웹 미리보기** | Node 20+ (이미 있음) | 추가 설치 불필요 (react-native-web 포함) |
| **EAS 빌드 (cloud)** | Expo 계정 | `npx eas login` |

### 빠른 진단
```bash
# Xcode 풀 설치 여부
xcrun simctl help >/dev/null 2>&1 && echo "iOS sim OK" || echo "Xcode 풀 설치 필요"

# Android Studio + AVD
adb devices                # 디바이스 + 에뮬레이터 목록
emulator -list-avds        # 사용 가능한 AVD

# Node 버전
node -v                    # v20+ 권장
```

---

## 1. 가장 빠른 실행 — Expo Go (Xcode/Android Studio 불필요)

폰만 있으면 5 분 안에 실기기 위에서 동작.

```bash
cd VNB4-Toeic-app
pnpm install
pnpm start
```
출력된 **QR 코드를 폰으로 스캔**:
- iOS: 카메라 앱으로 스캔 → Expo Go 가 열림
- Android: Expo Go 앱 안에서 "Scan QR Code"

> 폰과 Mac 이 **같은 Wi-Fi** 에 있어야 함. 다른 네트워크면 `pnpm start --tunnel` 사용 (ngrok 기반, 느림).

---

## 2. iOS 시뮬레이터에서 실행

Xcode 풀 설치 필요 (Command Line Tools 만으로는 안 됨).

```bash
pnpm ios            # 시뮬레이터 자동 부팅 후 네이티브 빌드·실행
pnpm ios:go         # 시뮬레이터 자동 부팅 후 Expo Go (네이티브 컴파일 우회)
# 또는
pnpm start  # 후 i 키
```

`pnpm ios` ([scripts/run.mjs](scripts/run.mjs)) 가 부팅된 시뮬레이터 없으면 가용 iPhone 을
자동 부팅(`xcrun simctl boot` + `bootstatus` 대기) 후 실행합니다.

> ⚠️ 현재 폴더 경로의 괄호(`Apps(Android,iOS,...)`) 때문에 **`pnpm ios` (네이티브 빌드) 는 실패**합니다 (§7).
> → 괄호 없는 경로로 폴더 이동, 또는 **`pnpm ios:go`** (Expo Go, 경로 무관 동작) 사용.

**에러 "Xcode must be fully installed"** 발생 시:
1. App Store 에서 Xcode 설치 (≈15GB, 30분~)
2. 설치 후 한 번 실행하여 라이선스 동의 + 컴포넌트 다운로드
3. CLT 경로 전환:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   xcodebuild -runFirstLaunchCheck
   xcrun simctl help    # 정상 출력되면 준비 완료
   ```

---

## 3. Android 에뮬레이터에서 실행

Android Studio + AVD 필요.

```bash
cd VNB4-Toeic-app
pnpm android        # 에뮬레이터 자동 부팅 후 빌드·실행
```

`pnpm android` ([scripts/run.mjs](scripts/run.mjs)) 가 자동으로:
1. `ANDROID_HOME` (기본 `~/Library/Android/sdk`) + `JAVA_HOME` (Android Studio JBR) 설정
2. 실행 중 디바이스 없으면 첫 AVD (`emulator -list-avds`) 부팅 + 부팅완료 대기
3. `expo run:android` 실행

수동으로 특정 AVD 를 띄우고 싶으면:
```bash
emulator -avd Medium_Phone &     # 본인 AVD 이름
adb devices                      # device 한 줄 보이면 OK
pnpm android
```

**에러 "No Android connected device found"** 발생 시:
1. Android Studio 설치 (https://developer.android.com/studio)
2. SDK Manager 에서 SDK Platform 34 + Build-Tools 설치
3. AVD Manager 에서 emulator 생성 (Pixel 권장)
4. 환경변수 (zsh):
   ```bash
   echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
   echo 'export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools' >> ~/.zshrc
   source ~/.zshrc
   ```
5. `emulator -list-avds` 로 이름 확인 후 실행, `adb devices` 로 인식 확인
6. 다시 `pnpm android`

실기기를 USB 로 쓸 경우: 폰 "개발자 옵션 → USB 디버깅 활성화", `adb devices` 에 인식되어야 함.

---

## 4. 웹 미리보기 (브라우저)

```bash
pnpm web
```
`http://localhost:8081` 열림.

**에러 "react-native-web@~0.19.10, react-dom@18.2.0"** 발생 시:
필요 deps 가 미포함된 상태. 본 프로젝트에는 포함되어 있음 — 만약 다시 발생하면:
```bash
npx expo install react-native-web react-dom
```

> React Native 컴포넌트가 웹에서 100% 동일 동작하지 않음. 시뮬레이터/실기기 위주로 테스트 권장.

---

## 5. EAS 빌드 (cloud, 실 IPA/APK)

```bash
npx eas-cli login            # 첫 1회
npx eas-cli build --platform ios       # 또는 android, all
npx eas-cli build --platform android
```

**에러 "Nonexistent flag: --plaform"** → 오타. 정확한 옵션은 `--platform` (l 누락 X).

[eas.json](eas.json) 에 development/preview/**staging**/production + submit 프로파일 포함됨.
**스토어 업로드(개발자 사이트 → 인증서·서비스계정 발급 → `eas submit`) 전 과정은 [PUBAPP.md](PUBAPP.md) 참고.**
**실기기 설치(개발자 모드 없이) — Expo Go / TestFlight 상세 가이드: [PUBAPP.md §G](PUBAPP.md).**

> ⚠️ 상위 폴더 경로의 괄호(`Apps(Android,iOS,...)`) 때문에 **로컬** `expo run:ios` 는 실패하지만,
> **EAS 클라우드 빌드는 영향 없음** (CI 클린 경로). §7 에러 매트릭스 참고.

---

## 6. 환경 변수

`app.json` → `expo.extra.apiUrl` 이 백엔드 URL.
런타임에 다른 URL 쓰려면 `EXPO_PUBLIC_API_URL=https://api.example.com pnpm start` 처럼 prefix.

---

## 7. 흔한 에러 → 조치 매트릭스

| 에러 메시지 | 원인 | 조치 |
|------------|------|------|
| `Unable to run simctl: xcrun simctl help exited with non-zero code: 72` | Xcode CLT 만 설치됨 | Xcode 풀 설치 → §2 참조 |
| `Xcode must be fully installed before you can continue. Continue to the App Store?` | 동일 | App Store 에서 Xcode 설치 |
| `It looks like you're trying to use web support but don't have the required dependencies` | `react-native-web` / `react-dom` 미설치 | `npx expo install react-native-web react-dom` |
| `No Android connected device found, and no emulators could be started automatically` | AVD 없음 또는 ADB 미인식 | §3 참조 (Android Studio + AVD) |
| `userInterfaceStyle: Install expo-system-ui in your project to enable this feature` | `expo-system-ui` 미설치 | `npx expo install expo-system-ui` (본 프로젝트에 포함) |
| `Nonexistent flag: --plaform` | EAS CLI 명령 오타 | `--platform` 사용 (l 누락 안 함) |
| `Metro stuck on "Loading dependency graph"` | 캐시 손상 | `pnpm start --clear` 또는 `rm -rf node_modules .expo && pnpm install` |
| iOS `expo run:ios` → `[CP-User] Generate Specs` / `syntax error near unexpected token 'Android,iOS,...'` | **상위 폴더 경로에 괄호/쉼표** (`Apps(Android,iOS,...)`) 가 있어 RN Xcode 스크립트의 `/bin/sh` 가 깨짐 | 로컬 네이티브 iOS 빌드는 **괄호 없는 경로로 폴더 이동/이름변경** 필요 (예: `~/Developer/VNB4-Toeic-app`). 또는 EAS 클라우드 빌드 사용 (CI 경로는 영향 없음). Expo Go 실행은 영향 없음 |
| Android `react-native-mmkv:compileDebugJavaWithJavac FAILED` / `cannot be converted to NativeModule` | mmkv 3.x 는 RN New Architecture 필요, 본 프로젝트는 RN 0.74 old-arch | 미사용 의존성이라 **제거 완료**. 다시 추가 시 `2.x` 사용 또는 New Arch 활성화 |
| Android 에뮬레이터 `App isn't 16 KB compatible` 다이얼로그 | Android 15 16KB-page 에뮬 이미지 + RN 0.74 미정렬 `.so` | 개발용 정보성 경고. 앱은 page-size 호환 모드로 정상 동작. "Don't Show Again" 탭. 스토어 16KB 요구는 추후 RN 업그레이드로 대응 |
| `Unable to resolve module ...` | 새 패키지 후 Metro 캐시 | 동일 — `--clear` |
| `ERR_PNPM_IGNORED_BUILDS: Ignored build scripts: ...` | pnpm 11 strict 차단 정책 | 본 프로젝트 `pnpm-workspace.yaml` 에 `dangerouslyAllowAllBuilds: true` 설정됨 → 새로 보이면 yaml 에 잘못 작성된 `allowBuilds:` placeholder 블록 있을 가능성. yaml 정리 후 `rm -rf node_modules && pnpm install` 재실행 |
| `allowBuilds:` 블록이 `pnpm-workspace.yaml` 에 자동 작성됨 | `pnpm approve-builds` 인터랙티브 명령을 빈 응답으로 종료 | 블록 수동 삭제. `dangerouslyAllowAllBuilds: true` 만 남기기. `approve-builds` 명령은 절대 사용 X |

---

## 8. Commands 요약

```bash
pnpm install            # 의존성 설치
pnpm start              # Expo dev tools (QR + 시뮬레이터 단축키)
pnpm start --clear      # Metro 캐시 클리어 후 시작
pnpm start --tunnel     # 다른 네트워크/외부 폰에서 접속 시
pnpm ios                # 시뮬레이터 자동 부팅 + iOS 네이티브 빌드 (괄호없는 경로 필요)
pnpm ios:go             # 시뮬레이터 자동 부팅 + Expo Go (경로 무관)
pnpm android            # 에뮬레이터 자동 부팅 + Android 네이티브 빌드
pnpm web                # 브라우저
pnpm typecheck          # tsc --noEmit
pnpm lint               # eslint (legacy config, .eslintrc.js)
pnpm gen:seed           # DB 전 파트 시드 → assets/seed/words.json 번들 갱신

# 목 데이터로 백엔드 없이 실행
EXPO_PUBLIC_USE_MOCK=1 pnpm start
# 경로 괄호로 로컬 iOS 네이티브 빌드 막힐 때 — Expo Go (네이티브 컴파일 우회)
EXPO_PUBLIC_USE_MOCK=1 pnpm exec expo start --ios --go
```

---

## 9. Why Expo (PRD §5.1)

PRD 1순위 추천 채택. iOS/Android/web 동시 출시 + EAS 빌드/OTA. 학습 카드 + 오디오 라이브러리 성숙.

## 10. Why expo-av (not react-native-track-player)

PRD §5.1 후보 중 track-player는 Apache-2.0 + lock-screen 컨트롤 지원하나 단어암기 짧은 클립에 과함.
expo-av가 zero-config + EAS 호환 + Expo Go 동작. 백그라운드 재생/큐 필요 시 track-player로 교체.
