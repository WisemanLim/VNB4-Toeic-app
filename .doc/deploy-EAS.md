# Build & deploy — VNB4 TOEIC (EAS)

Cloud builds, code signing, and store submission via [EAS](https://docs.expo.dev/eas/). Profiles live in [`eas.json`](../eas.json).

## One-time setup

```bash
pnpm add -g eas-cli            # or: npx eas-cli@latest
eas login                      # Expo account
eas init                       # links the project, writes extra.eas.projectId
```

## Build profiles

| Profile | Use | Signing | Backend |
| :-- | :-- | :-- | :-- |
| `development` | dev client on simulator/device | auto (debug) | mock |
| `preview` | internal QA (APK / ad-hoc) | auto (managed) | mock |
| `production` | store release (AAB / IPA) | managed credentials | real API |

```bash
eas build --profile preview    --platform all
eas build --profile production --platform all
```

## Code signing (managed credentials — recommended)

EAS generates and stores signing material for you:

- **iOS** — Distribution certificate + provisioning profile, created on first
  `eas build -p ios`. Requires an **Apple Developer Program** membership ($99/yr)
  and that you log in with your Apple ID when prompted.
- **Android** — Upload keystore generated and stored by EAS on first
  `eas build -p android`. Back it up: `eas credentials`.

To bring your own credentials instead, run `eas credentials` and follow the prompts.

### App identifiers (must match the stores)

| Platform | Identifier | Source |
| :-- | :-- | :-- |
| iOS | `io.vnb4.toeic` | [app.json](../app.json) `ios.bundleIdentifier` |
| Android | `io.vnb4.toeic` | [app.json](../app.json) `android.package` |

## Store submission

```bash
# iOS → TestFlight / App Store Connect
eas submit --profile production --platform ios

# Android → Play Console internal track
eas submit --profile production --platform android
```

Fill the placeholders in [`eas.json`](../eas.json) `submit.production` first:

- iOS: `appleId`, `ascAppId`, `appleTeamId`
- Android: path to a Play **service-account JSON** with the *Release Manager* role
  (Play Console → Setup → API access). Keep it out of git.

## OTA updates (JS-only changes)

```bash
eas update --branch production --message "fix copy"
```

Ships JS/asset changes without a store review. Native changes (new native modules,
permission changes) still require a full `eas build` + resubmit.

## Local release builds (no EAS, advanced)

```bash
# iOS archive (requires Xcode + Apple signing in keychain)
cd ios && xcodebuild -workspace VNB4TOEIC.xcworkspace -scheme VNB4TOEIC \
  -configuration Release -archivePath build/VNB4.xcarchive archive

# Android release AAB
cd android && ./gradlew bundleRelease    # outputs app/build/outputs/bundle/release/
```

Local release signing requires you to manage the keystore / certificates yourself;
EAS managed credentials are simpler for most teams.
