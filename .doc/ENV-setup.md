# Environment setup — VNB4 TOEIC (Expo / React Native)

What this project expects on your machine. Items marked **automated** are handled by Expo's build pipeline; the rest you do once.

## Toolchain

| Tool | Version | Notes |
| :-- | :-- | :-- |
| Node | 20+ | `node -v` |
| pnpm | 10+ | package manager (see `pnpm-workspace.yaml`) |
| Xcode | full install | iOS simulator + device builds. CLT alone is not enough. |
| Android Studio | latest | bundles JDK (JBR) + SDK + AVD |
| Watchman | optional | faster Metro file watching (`brew install watchman`) |

### iOS prerequisites

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcrun simctl help >/dev/null 2>&1 && echo "iOS sim OK"
# CocoaPods (managed by expo run:ios, but install once):
sudo gem install cocoapods    # or: brew install cocoapods
```

> ⚠️ **경로 제약** — `expo run:ios` (로컬 네이티브 빌드) 는 프로젝트 경로에 괄호/쉼표가
> 있으면 RN Xcode 스크립트 단계에서 `/bin/sh` 가 깨져 실패합니다. 현재 상위 폴더
> `Apps(Android,iOS,...)` 가 그 경우입니다. 로컬 네이티브 iOS 빌드를 하려면 괄호 없는
> 경로로 옮기세요. **Expo Go (`expo start --ios --go`) 와 EAS 클라우드 빌드는 영향 없음.**

### Android prerequisites

Android Studio bundles everything; just export the paths to your shell rc file.

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
# JDK 17+ ships inside Android Studio:
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

emulator -list-avds      # confirm at least one AVD exists
adb devices              # list running devices/emulators
```

Create an AVD in Android Studio → **Device Manager** if `emulator -list-avds` is empty.

## Install & run

```bash
pnpm install

# Fastest: Expo Go on a physical phone (no Xcode/Studio needed)
pnpm start                      # scan QR with Expo Go

# Native dev build on simulators/emulators
pnpm ios                        # expo run:ios
pnpm android                    # expo run:android   (emulator must be booted)

# Web preview
pnpm web
```

## Mock vs real backend

The app ships with an in-memory mock backend so it runs with **no server**.

| Variable | Effect |
| :-- | :-- |
| `EXPO_PUBLIC_USE_MOCK=1` | force mock data (default when API_URL is localhost) |
| `EXPO_PUBLIC_API_URL=https://…` | point at a real backend (`/api/v1` is appended) |

```bash
# demo / offline
EXPO_PUBLIC_USE_MOCK=1 pnpm ios

# against a real API
EXPO_PUBLIC_API_URL=https://api.vnb4.io pnpm ios
```

See [src/core/config.ts](../src/core/config.ts) and [src/core/mocks.ts](../src/core/mocks.ts).

## Quick diagnostics

```bash
pnpm typecheck                  # tsc --noEmit
pnpm lint                       # eslint (legacy config, see .eslintrc.js)
pnpm exec expo export --platform ios   # validate the JS bundle builds
```
