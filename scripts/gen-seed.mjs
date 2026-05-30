#!/usr/bin/env node
// Bundles the database seed (all parts) into the app so the offline/mock build
// ships every part's words. Reads database/seeds/parts/part*.json, converts the
// snake_case seed shape to the app Word shape, writes assets/seed/words.json
// (committed → included in every EAS/offline build).
//
//   node scripts/gen-seed.mjs
//   VNB4_SEED_DIR=/path/to/database/seeds/parts node scripts/gen-seed.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const CANDIDATES = [
  process.env.VNB4_SEED_DIR,
  join(APP_ROOT, "..", "VNB4-Toeic-database", "seeds", "parts"),
  join(os.homedir(), "Developer", "Web(Node,Script)", "VNB4-Toeic-database", "seeds", "parts"),
].filter(Boolean);

const seedDir = CANDIDATES.find((p) => existsSync(p));
if (!seedDir) {
  console.error("Seed dir not found. Set VNB4_SEED_DIR to database/seeds/parts.");
  console.error("Tried:\n  " + CANDIDATES.join("\n  "));
  process.exit(1);
}

// Canonicalize part-of-speech (collected data uses abbreviations / mis-tags).
const POS_CANON = {
  prep: "preposition", adj: "adjective", adv: "adverb", conj: "conjunction",
  det: "determiner", "wh-word": "pronoun", place: "noun", time: "noun", abbr: "abbreviation",
};
const normPos = (p) => {
  if (!p) return undefined;
  const k = String(p).trim().toLowerCase();
  return POS_CANON[k] ?? k;
};
const LOCALE = { "en-US": "en_US", "en-GB": "en_GB", "en-AU": "en_AU" };

const tts = (text, locale) =>
  `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${
    locale.startsWith("en") ? "en" : locale
  }&q=${encodeURIComponent(text)}`;

function toWord(s) {
  const audio =
    Array.isArray(s.audio) && s.audio.length
      ? s.audio
          .filter((a) => LOCALE[a.locale])
          .map((a) => ({ locale: LOCALE[a.locale], provider: a.provider ?? "seed", url: a.url }))
      : ["en_US", "en_GB", "en_AU"].map((locale) => ({
          locale,
          provider: "tts",
          url: tts(s.word, locale),
        }));

  return {
    id: s.id,
    word: s.word,
    meaningKo: s.meaning_ko,
    ...(s.pos ? { pos: normPos(s.pos) } : {}),
    ...(s.ipa ? { ipa: s.ipa } : {}),
    ...(s.pron_ko ? { pronKo: s.pron_ko } : {}),
    ...(s.example_en ? { exampleEn: s.example_en } : {}),
    ...(s.example_ko ? { exampleKo: s.example_ko } : {}),
    imageUrl: s.image_url || `https://picsum.photos/seed/toeic-${encodeURIComponent(s.word)}/640/420`,
    part: s.part,
    ...(s.topic ? { topic: s.topic } : {}),
    ...(s.synonyms ? { synonyms: s.synonyms } : {}),
    ...(s.frequency_tier != null ? { frequencyTier: s.frequency_tier } : {}),
    audio,
  };
}

const files = readdirSync(seedDir)
  .filter((f) => /^part\d+\.json$/.test(f))
  .sort();

const words = [];
const seen = new Set(); // dedupe (part, word) — mirrors database/seeds/run.ts
let skipped = 0;
for (const f of files) {
  const arr = JSON.parse(readFileSync(join(seedDir, f), "utf8"));
  let kept = 0;
  for (const s of arr) {
    const key = `${s.part}|${String(s.word).toLowerCase()}`;
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    words.push(toWord(s));
    kept++;
  }
  console.log(`  ${f}: ${arr.length} records → ${kept} kept`);
}
if (skipped) console.log(`  (skipped ${skipped} duplicate (part,word))`);

const outDir = join(APP_ROOT, "assets", "seed");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, "words.json");
writeFileSync(out, JSON.stringify(words));
console.log(`✓ ${words.length} words → ${out} (${(JSON.stringify(words).length / 1024).toFixed(0)} KB)`);

// 문장쓰기/쉐도잉 — bundle seeds/sentences/*.json (sibling of parts dir) as camelCase.
const sentDir = join(seedDir, "..", "sentences");
if (existsSync(sentDir)) {
  const sentences = [];
  for (const f of readdirSync(sentDir).filter((x) => /^part\d+\.json$/.test(x)).sort()) {
    for (const s of JSON.parse(readFileSync(join(sentDir, f), "utf8"))) {
      sentences.push({
        id: s.id,
        part: s.part,
        day: s.day,
        order: s.order,
        prompt: s.prompt,
        answer: s.answer,
        fullSentence: s.full_sentence,
        translationKo: s.translation_ko,
        tokens: s.tokens ?? [],
      });
    }
  }
  const sOut = join(outDir, "sentences.json");
  writeFileSync(sOut, JSON.stringify(sentences));
  console.log(`✓ ${sentences.length} sentences → ${sOut}`);
}
