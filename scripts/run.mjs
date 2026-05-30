#!/usr/bin/env node
// Launches the app, auto-booting an emulator/simulator if none is running.
//   node scripts/run.mjs android          -> boot AVD + expo run:android
//   node scripts/run.mjs ios              -> boot simulator + expo run:ios
//   node scripts/run.mjs ios --go         -> boot simulator + expo start --ios --go (Expo Go)
// Extra args after the platform are forwarded to the expo command.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const EXPO = path.join(ROOT, "node_modules", ".bin", "expo");

const platform = process.argv[2];
const useGo = process.argv.includes("--go");
const passthrough = process.argv.slice(3).filter((a) => a !== "--go");
const env = { ...process.env };

if (platform !== "ios" && platform !== "android") {
  console.error("Usage: node scripts/run.mjs <ios|android> [--go] [expo args...]");
  process.exit(1);
}

const sleep = (ms) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const sh = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: "utf8", ...opts });

function exec(cmd, args) {
  const r = spawn(cmd, args, { stdio: "inherit", env, cwd: ROOT });
  r.on("exit", (code) => process.exit(code ?? 0));
}

// ---------------------------------------------------------------- Android
function ensureAndroidEmulator() {
  const sdk =
    env.ANDROID_HOME ||
    env.ANDROID_SDK_ROOT ||
    path.join(os.homedir(), "Library/Android/sdk");
  env.ANDROID_HOME = sdk;
  const adb = path.join(sdk, "platform-tools", "adb");
  const emulator = path.join(sdk, "emulator", "emulator");

  if (!existsSync(adb)) {
    console.error(`adb not found at ${adb}. Install Android SDK / set ANDROID_HOME.`);
    process.exit(1);
  }

  // Use Android Studio's bundled JDK when JAVA_HOME is unset OR points to a
  // missing dir (e.g. a stale VSCode java-extension path).
  const javaOk = env.JAVA_HOME && existsSync(path.join(env.JAVA_HOME, "bin", "java"));
  if (!javaOk) {
    const jbr = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
    if (existsSync(path.join(jbr, "bin", "java"))) {
      env.JAVA_HOME = jbr;
      console.log(`✓ JAVA_HOME → ${jbr}`);
    } else if (!javaOk) {
      console.error(
        `JAVA_HOME invalid (${env.JAVA_HOME ?? "unset"}) and Android Studio JBR not found.\n` +
          "Install Android Studio or set JAVA_HOME to a JDK 17+.",
      );
      process.exit(1);
    }
  }

  const running = sh(adb, ["devices"])
    .stdout.split("\n")
    .some((l) => l.includes("\tdevice"));
  if (running) {
    console.log("✓ Android device/emulator already running.");
    return;
  }

  const avds = sh(emulator, ["-list-avds"]).stdout.split("\n").filter(Boolean);
  if (!avds.length) {
    console.error(
      "No AVD found. Create one: Android Studio → Device Manager → Create device.",
    );
    process.exit(1);
  }
  const avd = avds[0];
  console.log(`▶ Booting Android emulator: ${avd} ...`);
  spawn(emulator, ["-avd", avd, "-no-snapshot-save", "-no-boot-anim"], {
    detached: true,
    stdio: "ignore",
    env,
  }).unref();

  sh(adb, ["wait-for-device"]);
  for (let i = 0; i < 90; i++) {
    const booted = sh(adb, ["shell", "getprop", "sys.boot_completed"]).stdout.trim();
    if (booted === "1") {
      console.log("✓ Emulator booted.");
      return;
    }
    sleep(2000);
  }
  console.error("Emulator did not finish booting in time.");
  process.exit(1);
}

// -------------------------------------------------------------------- iOS
function ensureIosSimulator() {
  if (/Booted/.test(sh("xcrun", ["simctl", "list", "devices", "booted"]).stdout)) {
    console.log("✓ iOS simulator already booted.");
    sh("open", ["-a", "Simulator"]);
    return;
  }
  const json = JSON.parse(
    sh("xcrun", ["simctl", "list", "devices", "available", "--json"]).stdout || "{}",
  );
  const device = Object.values(json.devices || {})
    .flat()
    .find((d) => d.isAvailable && /iPhone/.test(d.name));
  if (!device) {
    console.error("No available iPhone simulator. Add one in Xcode → Settings → Platforms.");
    process.exit(1);
  }
  console.log(`▶ Booting iOS simulator: ${device.name} ...`);
  sh("xcrun", ["simctl", "boot", device.udid]);
  sh("open", ["-a", "Simulator"]);
  sh("xcrun", ["simctl", "bootstatus", device.udid]); // blocks until booted
  console.log("✓ Simulator booted.");
}

// ------------------------------------------------------------------- main
if (platform === "android") {
  ensureAndroidEmulator();
  exec(EXPO, ["run:android", ...passthrough]);
} else {
  ensureIosSimulator();
  // Local `expo run:ios` breaks when the project path contains parens/commas
  // (RN Xcode script phase). Use --go for the Expo Go path in that case.
  exec(EXPO, useGo ? ["start", "--ios", "--go", ...passthrough] : ["run:ios", ...passthrough]);
}
