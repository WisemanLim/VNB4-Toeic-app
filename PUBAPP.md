# PUBAPP — 배포 가이드 (iOS · Android · Web)

> 🌐 **언어 / Language**: **한국어** · [English](PUBAPP.en.md)

VNB4 TOEIC 앱을 EAS로 빌드해서 양대 스토어(iOS App Store · Google Play)에 올리고, 웹(Expo Web)을
배포하는 전 과정. 개발자 사이트 접속부터 자격증명 발급·등록, `eas.json` placeholder 채우기,
빌드·제출·웹 호스팅까지 순서대로.

- **App 이름** — VNB4 TOEIC
- **Bundle ID (iOS)** — `io.vnb4.toeic`
- **Package (Android)** — `io.vnb4.toeic`
- 관련 파일 — [eas.json](eas.json), [.doc/store-metadata.md](.doc/store-metadata.md), [.doc/deploy-EAS.md](.doc/deploy-EAS.md)

> ⚠️ 이 저장소 상위 경로 `Apps(Android,iOS,...)` 의 괄호 때문에 **로컬** `expo run:ios` 는 깨집니다.
> 하지만 **EAS 클라우드 빌드는 깨끗한 CI 경로에서 돌아가므로 영향 없습니다.** 그대로 진행 가능.

---

## 0. 공통 사전 준비 (한 번)

```bash
# EAS CLI 설치 + 로그인
npm i -g eas-cli           # 또는 매번 npx eas-cli@latest
eas login                  # Expo 계정 (없으면 expo.dev 가입)
eas whoami                 # 로그인 확인

# 프로젝트를 Expo 계정에 연결 → app.json 에 extra.eas.projectId 기록됨
cd VNB4-Toeic-app
eas init
```

### 버전 체계 확인

| 항목 | 위치 | 비고 |
|---|---|---|
| 표시 버전 | [app.json](app.json) `expo.version` (현재 `0.1.0`) | 스토어 노출 버전 |
| iOS 빌드번호 | EAS `autoIncrement` (production 프로파일) | 제출마다 자동 +1 |
| Android versionCode | EAS `autoIncrement` | 제출마다 자동 +1 |

`eas.json` 의 `cli.appVersionSource: "remote"` 라 빌드번호를 EAS가 관리합니다. 첫 빌드 때
"manage remotely" 선택하면 됩니다.

---

# A. iOS — App Store

## A-1. Apple Developer 멤버십 확인

1. https://developer.apple.com/account 접속 (Apple ID 로그인).
2. **Membership details** 진입.
3. 두 값을 메모 — 나중에 `eas.json` 에 들어감:
   - **Team ID** (10자리, 예 `A1BCDE2FG3`) → `eas.json` 의 `appleTeamId`
   - Apple ID 이메일 → `eas.json` 의 `appleId`
4. 멤버십 상태가 **Active** 인지 확인 ($99/yr 결제 완료 상태).

## A-2. App ID(Identifier) 등록

> EAS가 빌드 시 자동 생성해 주기도 하지만, 미리 등록해두면 명확합니다.

1. https://developer.apple.com/account/resources/identifiers/list 접속.
2. **+** → **App IDs** → **App** 선택 → Continue.
3. 입력:
   - **Description** — `VNB4 TOEIC`
   - **Bundle ID** — Explicit → `io.vnb4.toeic`
4. Capabilities — 현재 앱은 특수 권한 불필요. 기본값 유지.
   (추후 Push/Sign in with Apple 추가 시 여기서 체크)
5. Continue → Register.

## A-3. App Store Connect 에서 앱 생성

1. https://appstoreconnect.apple.com → **My Apps** → **+** → **New App**.
2. 입력:
   - **Platform** — iOS
   - **Name** — `VNB4 토익 단어` (스토어 노출명, 중복 불가)
   - **Primary Language** — Korean
   - **Bundle ID** — 목록에서 `io.vnb4.toeic` 선택
   - **SKU** — `vnb4-toeic-ios` (내부 식별자, 자유)
   - **User Access** — Full Access
3. Create.
4. 생성된 앱 → **App Information** → **General Information** 에서
   **Apple ID** (10자리 숫자, 예 `6478912345`) 메모 → `eas.json` 의 `ascAppId`.

## A-4. 코드 사이닝 (EAS 관리형 — 권장)

직접 인증서/프로파일을 만들 필요 없습니다. 첫 iOS 빌드 때 EAS가 만들어 저장합니다.

```bash
eas build --profile production --platform ios
```

진행 중 프롬프트:
- "Generate a new Apple Distribution Certificate?" → **Yes**
- "Generate a new Apple Provisioning Profile?" → **Yes**
- Apple 계정 로그인 요구 시 A-1 의 Apple ID 입력 (2FA 코드 입력).

EAS가 배포 인증서 + App Store 프로비저닝 프로파일을 생성·보관합니다.
이후 확인/백업: `eas credentials` → iOS.

> 직접 관리하려면 `eas credentials` 에서 기존 .p12 + .mobileprovision 업로드 가능.

## A-5. `eas.json` placeholder 채우기 (iOS)

[eas.json](eas.json) `submit.production.ios` 의 3개 값을 위에서 모은 값으로 교체:

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

## A-6. 빌드 → 제출 → TestFlight → 심사

```bash
# 1) 프로덕션 IPA 빌드 (A-4 에서 이미 했으면 생략 가능)
eas build --profile production --platform ios

# 2) App Store Connect 로 업로드
eas submit --profile production --platform ios --latest
```

`eas submit` 이 묻는 것:
- "What would you like to submit?" → 방금 만든 빌드 선택 (`--latest` 면 자동).
- App Store Connect **API Key** 권장 — 없으면 Apple ID/비번으로도 가능.
  (API Key 발급: App Store Connect → Users and Access → **Integrations / Keys** →
   App Store Connect API → **+** → Access: App Manager → .p8 다운로드 + Key ID + Issuer ID.
   EAS가 한 번 등록하면 재사용.)

업로드 후:
1. App Store Connect → 앱 → **TestFlight** 탭에서 처리 대기 (10~30분, "Processing").
2. 처리 완료 후 내부 테스터 추가 → 실기기 검증.
3. 스토어 출시: **App Store** 탭 → 버전 → 메타데이터 입력
   ([.doc/store-metadata.md](.doc/store-metadata.md) 복붙) → 스크린샷 업로드 →
   빌드 선택 → **Add for Review** → **Submit for Review**.

### iOS 제출 전 필수 입력 (없으면 심사 거부)

- 스크린샷: 6.7"(1290×2796) + 6.5" 최소 1세트
- 개인정보처리방침 URL
- App Privacy 설문 (수집 데이터 — 로그인 이메일 사용 시 "Contact Info" 신고)
- 연령 등급 설문 (4+)

---

# B. Android — Google Play

## B-1. Play Console 접속 + 앱 만들기

1. https://play.google.com/console 접속 (개발자 계정 로그인, $25 일회성 결제 완료 상태).
2. **Create app**:
   - **App name** — `VNB4 토익 단어`
   - **Default language** — 한국어 (ko-KR)
   - **App or game** — App
   - **Free or paid** — Free
   - 선언 동의 체크 → Create app.

## B-2. 패키지명 등록

패키지명 `io.vnb4.toeic` 는 **첫 AAB 업로드 시 자동 확정**됩니다. 별도 사전 등록 불필요.
(한 번 업로드하면 변경 불가 — `io.vnb4.toeic` 맞는지 [app.json](app.json) 확인.)

## B-3. Play App Signing + 업로드 키 (EAS 관리형 — 권장)

Google Play 는 **Play App Signing** 으로 최종 서명을 관리합니다. 개발자는 "업로드 키"만 관리.
EAS가 업로드 키스토어를 생성·보관:

```bash
eas build --profile production --platform android
```

- "Generate a new Android Keystore?" → **Yes**.
- EAS가 keystore 생성 후 보관. **반드시 백업**: `eas credentials` → Android →
  Download. (분실 시 앱 업데이트 불가 — Google 에 재설정 요청해야 함)

첫 AAB를 Play Console 에 올리면 Play App Signing 이 자동 활성화됩니다.

## B-4. 서비스 계정 JSON 발급 (eas submit 자동화용)

`eas submit` 이 Play API 로 업로드하려면 서비스 계정 키가 필요합니다.

1. **Play Console** → 좌하단 **Setup** → **API access**.
2. "Choose a project to link" — 기존 Google Cloud 프로젝트 연결 or 새로 생성.
3. **Service accounts** 섹션 → **Create new service account** → Google Cloud Console 링크 클릭.
4. Google Cloud Console:
   - **CREATE SERVICE ACCOUNT** → 이름 `eas-play-publisher` → Create.
   - 역할(role)은 여기선 건너뛰어도 됨 → Done.
   - 만든 서비스계정 → **Keys** 탭 → **Add Key** → **Create new key** → **JSON** → 다운로드.
   - 이 JSON 파일을 프로젝트 루트에 `play-service-account.json` 으로 저장.
     **(절대 git 커밋 금지 — `.gitignore` 에 추가)**
5. 다시 Play Console → API access → 방금 만든 서비스계정 **Grant access**:
   - **App permissions** — VNB4 토익 단어 앱 추가
   - **Account permissions** — **Release** 관련 (Release manager) 체크 → Invite/Apply.

```bash
echo "play-service-account.json" >> .gitignore
```

## B-5. `eas.json` placeholder 확인 (Android)

[eas.json](eas.json) `submit.production.android` — 이미 설정됨, 경로만 맞으면 됨:

```json
"android": {
  "serviceAccountKeyPath": "./play-service-account.json",
  "track": "internal"      // internal → 검증 후 production 으로 승격
}
```

## B-6. 빌드 → 제출 → 내부 테스트 → 출시

```bash
# 1) 프로덕션 AAB 빌드 (B-3 에서 했으면 생략)
eas build --profile production --platform android

# 2) Play Console internal track 으로 업로드
eas submit --profile production --platform android --latest
```

> ⚠️ Google Play 정책: **첫 업로드는 수동**이어야 하는 경우가 많습니다.
> `eas submit` 이 "App not found / draft" 오류를 내면, 첫 AAB만 Play Console 에서
> 수동 업로드하세요: 앱 → **Testing → Internal testing → Create new release** →
> AAB 드래그(EAS 빌드 페이지에서 .aab 다운로드) → Review → Rollout.
> 이후 빌드부터는 `eas submit` 자동화 동작.

출시 단계:
1. **Internal testing** 트랙에서 테스터(이메일) 추가 → 링크로 설치 검증.
2. **Store listing** 작성 ([.doc/store-metadata.md](.doc/store-metadata.md) 복붙) — 간단한 설명,
   자세한 설명, 아이콘 512×512, 피처 그래픽 1024×500, 폰 스크린샷 ≥2.
3. **App content** 설문 전부 완료 (개인정보처리방침 URL, 데이터 보안, 광고, 타겟 연령, 콘텐츠 등급).
4. **Production** 트랙 → Create release → 검토 제출 → 심사(수시간~수일).

---

## C. 자격증명 값 — 어디서 찾나 (요약표)

| 값 | `eas.json` 키 | 출처 |
|---|---|---|
| Apple ID 이메일 | `submit.production.ios.appleId` | 본인 Apple 계정 |
| App Store Connect Apple ID (숫자) | `submit.production.ios.ascAppId` | App Store Connect → App Information → General → Apple ID |
| Apple Team ID | `submit.production.ios.appleTeamId` | developer.apple.com → Membership details |
| iOS 배포 인증서/프로파일 | (EAS 보관) | `eas credentials` 자동 생성 |
| Play 서비스계정 JSON | `submit.production.android.serviceAccountKeyPath` | Google Cloud Console → 서비스계정 → Keys → JSON |
| Android 업로드 키스토어 | (EAS 보관) | `eas credentials` 자동 생성 |

---

## C+. 환경변수 / 서버 주소(API_URL) 관리 ⚠️ 배포 핵심

앱의 **로그인 및 로그인 이후 모든 서버 요청**(단어·문장·복습·분석 동기화)은 단일 base URL
`API_URL` 로 나갑니다. 서버 대상이 환경마다 다르므로 **코드 변경 없이 환경변수로** 바꿉니다.

**우선순위** (`src/core/config.ts`): `EXPO_PUBLIC_API_URL`(env) → `app.json` `extra.apiUrl` → `http://localhost:4000`.

**데이터 소스 규칙** (`src/core/client.ts`):
- **게스트(미로그인)** = 번들 시드 + in-app mock → 네트워크 0, 오프라인 동작.
- **로그인** = `API_URL` 실서버 동기화. `/auth/*` 는 항상 서버.
- `EXPO_PUBLIC_USE_MOCK=1` = 인증과 무관하게 전부 mock(백엔드 0 데모) — **프로덕션은 반드시 미설정/0**.

**환경별 설정 위치** (`eas.json` `build.<profile>.env`):

| 프로파일 | `EXPO_PUBLIC_API_URL` | `EXPO_PUBLIC_USE_MOCK` | 용도 |
|---|---|---|---|
| `development` | (미설정→localhost) | `1` | dev client, 오프라인 mock |
| `preview` | (미설정) | `1` | 내부 배포 데모(백엔드 불필요) |
| `staging` | `https://staging-api.vnb4.io` | (미설정) | 실서버 연동 내부 테스트 |
| `production` | `https://api.vnb4.io` ← **실제 도메인으로 교체** | (미설정) | 스토어 출시 |

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

**유의사항**
- `EXPO_PUBLIC_*` 는 **빌드 시점에 번들에 박힘**(런타임 변경 불가). 서버 변경 시 **재빌드 또는 OTA(`eas update`)** 필요.
- 프로덕션 빌드가 localhost/사설 IP/`http://` 를 가리키면 앱 시작 시 `console.warn` 경고(로그인·동기화 실패 방지). 반드시 공개 **HTTPS** 엔드포인트로.
- 백엔드 **CORS** 는 웹 앱 origin 을 허용해야 함(NestJS `cors:true`).
- 토큰 저장: native=expo-secure-store, web=localStorage(자동 분기).

---

## D. 출시 전 체크리스트

- [ ] `app.json` `expo.version` 올림 (예 `0.1.0` → `1.0.0`)
- [ ] `production` 프로파일 `EXPO_PUBLIC_API_URL` 을 실제 백엔드 HTTPS 로 (현재 `https://api.vnb4.io` placeholder — mock 비활성) — C+ 참조
- [ ] `production`/`staging` 에 `EXPO_PUBLIC_USE_MOCK` 가 **없는지** 확인(있으면 전부 mock)
- [ ] 아이콘/스플래시 실제 에셋 ([assets/](assets/), `app.json`)
- [ ] iOS: 스크린샷 + 개인정보처리방침 URL + App Privacy 설문
- [ ] Android: 스크린샷 + 피처그래픽 + App content 설문 전부 완료
- [ ] `play-service-account.json` `.gitignore` 등록 확인
- [ ] EAS 자격증명 백업 (`eas credentials` → 다운로드, 양 플랫폼)

---

## E. OTA 업데이트 (JS만 변경 시 — 심사 불필요)

```bash
eas update --branch production --message "문구 수정"
```

JS/에셋 변경은 스토어 심사 없이 즉시 반영. 단, **네이티브 변경**(새 네이티브 모듈,
권한 추가, SDK 업그레이드)은 `eas build` + 재제출 필요.

---

## F. 자주 막히는 곳

| 증상 | 원인 | 조치 |
|---|---|---|
| `eas submit` iOS "Invalid App Store Connect API key" | API Key 미등록/만료 | App Store Connect → Integrations → Keys 재발급 후 `eas credentials` 재등록 |
| `eas submit` Android "The caller does not have permission" | 서비스계정 권한 부족 | Play Console → API access → 서비스계정 Release 권한 부여 (B-4 5번) |
| Android "Package not found" / draft | 첫 업로드 수동 필요 | 첫 AAB만 Play Console 에서 수동 업로드 (B-6 경고) |
| iOS "Missing compliance" | 수출 규정 미응답 | App Store Connect 빌드 → Export Compliance → "No"(암호화 미사용) 선택 |
| iOS 빌드 "No bundle identifier" | App ID 미등록 | A-2 재확인 |
| Android 16KB 경고 | RN 0.74 미정렬 .so | 출시엔 문제없음. Play 16KB 강제 전까지 OK. 추후 RN 업그레이드 |

---

## G. 실기기 설치 — 개발자 모드 없이

실기기에 올리는 3가지. **개발자 모드(Developer Mode)는 dev/ad-hoc 빌드 직접 설치에만 필요** —
Expo Go·TestFlight 는 일반 App Store 경로라 개발자 모드 불필요.

| 방법 | 개발자 모드 | Apple 계정($99) | 심사 | 용도 |
|---|---|---|---|---|
| **Expo Go** | ❌ 불필요 | ❌ 불필요 | ❌ | 개발 중 즉시 실기기 확인(같은 WiFi) |
| **TestFlight 내부** | ❌ 불필요 | ✅ 필요 | ❌(내부 100명) | 베타 배포·QA |
| **TestFlight 외부** | ❌ 불필요 | ✅ 필요 | ⚠ 베타 심사 1회 | 외부 테스터 최대 10,000명 |
| (참고) EAS dev build 직접 설치 | ✅ **필요** | ✅ 필요(UDID 등록) | ❌ | 네이티브 디버깅 |

### G-1. Expo Go (개발용, 가장 빠름)

앱에 `expo-dev-client` 플러그인이 없으므로 Expo Go 에서 바로 구동.

1. 아이폰을 개발 PC와 **같은 WiFi** 에 연결.
2. App Store 에서 **Expo Go** 설치.
3. 앱 폴더에서 dev 서버 기동 (실기기는 PC의 LAN IP 사용 — `localhost` 아님):
   ```bash
   EXPO_PUBLIC_API_URL=http://<PC-LAN-IP>:4000 pnpm start
   # 예: EXPO_PUBLIC_API_URL=http://172.30.1.65:4000 pnpm start
   ```
4. 터미널 QR 을 **카메라**로 스캔(자동 Expo Go) → 또는 Expo Go → "Enter URL manually" → `exp://<PC-LAN-IP>:8081`.
5. 게스트(오프라인) + 로그인(서버 동기화)까지 기기에서 동작. 백엔드도 같은 LAN(`:4000`)이어야 로그인 가능.

> 한계: 개발 PC가 켜져 있고 같은 네트워크여야 함. 독립 설치 아님(Expo Go 안에서 구동).

### G-2. TestFlight (실배포에 가장 가까움, 개발자 모드 불필요)

**선행**: Apple Developer 멤버십($99) + App Store Connect 에 앱 생성(§A-1~A-3) + `eas.json` `submit.production.ios` placeholder 채움(§A-5).

1. **빌드 (서버 주소 주입 확인)** — `production`(또는 `staging`) 프로파일의 `EXPO_PUBLIC_API_URL` 이 실제 HTTPS 백엔드인지 먼저 확인(§C+):
   ```bash
   eas build --profile production --platform ios
   ```
2. **업로드**:
   ```bash
   eas submit --profile production --platform ios --latest
   ```
3. App Store Connect → 앱 → **TestFlight** 탭 → 빌드 "Processing"(10~30분) 대기.
4. 처리 후 **Export Compliance**(암호화 미사용 → "No") 응답.
5. **내부 테스터(심사 없음, 즉시)**:
   - TestFlight → **Internal Testing** → 그룹 생성 → App Store Connect 사용자(팀원, 최대 100명)를 Apple ID 로 추가 → 빌드 할당.
6. **외부 테스터(최대 10,000명, 베타 심사 1회)**:
   - TestFlight → **External Testing** → 그룹 생성 → 테스터 이메일 추가 또는 **공개 링크** 생성 → 빌드 "Submit for Beta Review"(보통 수 시간~1일).
7. **기기에서 설치(테스터)**:
   - App Store 에서 **TestFlight** 앱 설치 → 초대 이메일/공개 링크의 **Redeem** → TestFlight 안에서 **Install** → 홈 화면에 앱 설치됨(개발자 모드 불필요).
8. **빌드 갱신**: 새 `eas build` + `eas submit` → TestFlight 가 자동으로 새 빌드 알림. JS만 바뀌면 §E OTA(`eas update`)로 심사 없이 갱신.

> 만료: TestFlight 빌드는 업로드 후 **90일** 유효. 새 빌드 올리면 갱신.

### G-3. (대안) EAS dev build 직접 설치 — 개발자 모드 필요

네이티브 디버깅이 필요할 때만. 이 레포는 상위 경로에 괄호(`Apps(Android,iOS,...)`)가 있어 **로컬 `expo run:ios` 네이티브 빌드는 실패** → 반드시 EAS 클라우드 빌드 사용.

1. 기기: 설정 → 개인정보 보호 및 보안 → **개발자 모드 켜기** → 재부팅.
2. UDID 등록: `eas device:create` (기기 UDID 입력 또는 등록 링크).
3. device 전용 프로파일로 빌드(현재 `development` 는 `ios.simulator:true` 라 시뮬용):
   ```bash
   # eas.json 에 simulator:false 인 device 프로파일 추가 후
   eas build --profile <device-profile> --platform ios
   eas build:run -p ios --latest    # 연결된 기기에 설치
   ```

---

## H. Web 배포 (Expo Web → 정적 호스팅)

RN-web으로 빌드한 정적 번들을 Netlify/Vercel/Cloudflare Pages/S3 등 어디서나 호스팅. 스토어 심사 없음.

### H-1. 정적 빌드

```bash
# 서버 주소를 실 백엔드로 주입해서 export (로그인+동기화가 이 주소로 나감)
EXPO_PUBLIC_API_URL=https://api.vnb4.io pnpm exec expo export --platform web
# 산출물: dist/  (정적 HTML/JS/CSS)
```

> `EXPO_PUBLIC_*` 는 **빌드 시점에 박힘**(§C+). 서버 주소 바뀌면 재export. 게스트=오프라인 mock, 로그인=이 API_URL.

### H-2. 호스팅 (택1)

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

### H-3. SPA 라우팅 + 유의사항

- expo-router 웹은 SPA → 호스트에서 **모든 경로를 `index.html` 로 폴백**(rewrite) 설정.
  - Netlify: `dist/_redirects` 에 `/* /index.html 200`.
  - Vercel: `vercel.json` 에 `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
- **CORS**: 백엔드(NestJS `cors:true`)가 웹 origin 허용해야 로그인/동기화 동작. 운영은 허용 origin 명시 권장.
- **HTTPS 필수**: 배포 도메인·API 모두 HTTPS(혼합콘텐츠 차단 회피).
- 토큰: 웹은 `localStorage` 저장(네이티브는 SecureStore) — 자동 분기.
- 관리자 웹(`VNB4-Toeic-frontend`)은 별개 앱(Next.js). 본 절은 **학습자 앱의 웹 버전**(Expo Web) 배포.

### H-4. 빠른 확인

```bash
pnpm exec serve dist      # 로컬에서 export 결과 확인
# → http://localhost:3000 게스트 홈/학습/문장쓰기 + 로그인 동기화 점검
```
