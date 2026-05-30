import type { Pos, Progress, ProgressStat, Lesson, Word } from "./schemas";
import { seedWords, seedSentences } from "./seed";

/**
 * Offline seed data so the app is fully demoable without a backend.
 * Real content (PRD §2.1: 파트별 최소 200단어) is served by backend/api;
 * this is a representative subset across parts 1–7 for offline/demo use.
 */

const TTS = (text: string, locale: string) =>
  // Public Google Translate TTS endpoint — fine for demo/dev playback.
  `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${
    locale.startsWith("en") ? "en" : locale
  }&q=${encodeURIComponent(text)}`;

const IMG = (word: string) =>
  // Deterministic illustration per word (PRD §2.2 image_url).
  `https://picsum.photos/seed/toeic-${word}/640/420`;

function word(w: {
  id: string;
  part: number;
  word: string;
  pos: Pos;
  meaningKo: string;
  ipa: string;
  pronKo: string;
  exampleEn: string;
  exampleKo: string;
}): Word {
  return {
    ...w,
    imageUrl: IMG(w.word),
    audio: [
      { locale: "en_US", provider: "mock", url: TTS(w.word, "en_US") },
      { locale: "en_GB", provider: "mock", url: TTS(w.word, "en_GB") },
      { locale: "en_AU", provider: "mock", url: TTS(w.word, "en_AU") },
    ],
  };
}

// Small inline set used only if the generated seed (assets/seed/words.json)
// is absent. The real offline build ships all parts via `seedWords`.
const INLINE_WORDS: Word[] = [
  word({ id: "p1-warehouse", part: 1, word: "warehouse", pos: "noun", meaningKo: "창고", ipa: "/ˈwerhaʊs/", pronKo: "웨어하우스", exampleEn: "The goods are stored in the warehouse.", exampleKo: "상품은 창고에 보관됩니다." }),
  word({ id: "p1-pavement", part: 1, word: "pavement", pos: "noun", meaningKo: "인도, 포장도로", ipa: "/ˈpeɪvmənt/", pronKo: "페이브먼트", exampleEn: "People are walking on the pavement.", exampleKo: "사람들이 인도를 걷고 있다." }),
  word({ id: "p1-lean", part: 1, word: "lean", pos: "verb", meaningKo: "기대다, 기울이다", ipa: "/liːn/", pronKo: "린", exampleEn: "A man is leaning against the wall.", exampleKo: "한 남자가 벽에 기대고 있다." }),
  word({ id: "p1-launch", part: 1, word: "launch", pos: "verb", meaningKo: "발사하다, 시작하다", ipa: "/lɔːntʃ/", pronKo: "런치", exampleEn: "They will launch the new rocket tomorrow.", exampleKo: "그들은 내일 새로운 로켓을 발사할 예정이다." }),

  word({ id: "p2-whether", part: 2, word: "whether", pos: "conjunction", meaningKo: "~인지 아닌지", ipa: "/ˈweðər/", pronKo: "웨더", exampleEn: "I'm not sure whether she will come.", exampleKo: "그녀가 올지 안 올지 모르겠다." }),
  word({ id: "p2-available", part: 2, word: "available", pos: "adjective", meaningKo: "이용 가능한, 시간이 되는", ipa: "/əˈveɪləbl/", pronKo: "어베일러블", exampleEn: "Are you available on Monday?", exampleKo: "월요일에 시간 되세요?" }),
  word({ id: "p2-prefer", part: 2, word: "prefer", pos: "verb", meaningKo: "선호하다", ipa: "/prɪˈfɜːr/", pronKo: "프리퍼", exampleEn: "Would you prefer tea or coffee?", exampleKo: "차와 커피 중 어느 것이 좋으세요?" }),

  word({ id: "p3-deadline", part: 3, word: "deadline", pos: "noun", meaningKo: "마감일", ipa: "/ˈdedlaɪn/", pronKo: "데드라인", exampleEn: "We need to finish the report before the deadline.", exampleKo: "우리는 마감일 전에 보고서를 끝내야 한다." }),
  word({ id: "p3-agenda", part: 3, word: "agenda", pos: "noun", meaningKo: "안건, 의제", ipa: "/əˈdʒendə/", pronKo: "어젠다", exampleEn: "The first item on the agenda is the budget.", exampleKo: "안건의 첫 항목은 예산입니다." }),
  word({ id: "p3-negotiate", part: 3, word: "negotiate", pos: "verb", meaningKo: "협상하다", ipa: "/nɪˈɡoʊʃieɪt/", pronKo: "니고시에이트", exampleEn: "We need to negotiate a better contract.", exampleKo: "더 나은 계약을 협상해야 합니다." }),
  word({ id: "p3-colleague", part: 3, word: "colleague", pos: "noun", meaningKo: "동료", ipa: "/ˈkɑːliːɡ/", pronKo: "칼리그", exampleEn: "She introduced me to her colleague.", exampleKo: "그녀는 나를 동료에게 소개했다." }),

  word({ id: "p4-announcement", part: 4, word: "announcement", pos: "noun", meaningKo: "공지, 발표", ipa: "/əˈnaʊnsmənt/", pronKo: "어나운스먼트", exampleEn: "Please listen to the following announcement.", exampleKo: "다음 공지를 들어 주세요." }),
  word({ id: "p4-voicemail", part: 4, word: "voicemail", pos: "noun", meaningKo: "음성 메시지", ipa: "/ˈvɔɪsmeɪl/", pronKo: "보이스메일", exampleEn: "He left a voicemail about the meeting.", exampleKo: "그는 회의에 관한 음성 메시지를 남겼다." }),
  word({ id: "p4-postpone", part: 4, word: "postpone", pos: "verb", meaningKo: "연기하다", ipa: "/poʊstˈpoʊn/", pronKo: "포스트폰", exampleEn: "The event was postponed due to rain.", exampleKo: "행사는 비 때문에 연기되었다." }),

  word({ id: "p5-invoice", part: 5, word: "invoice", pos: "noun", meaningKo: "송장, 청구서", ipa: "/ˈɪnvɔɪs/", pronKo: "인보이스", exampleEn: "Please send the invoice by Friday.", exampleKo: "금요일까지 송장을 보내주세요." }),
  word({ id: "p5-reimburse", part: 5, word: "reimburse", pos: "verb", meaningKo: "환급하다, 변제하다", ipa: "/ˌriːɪmˈbɜːrs/", pronKo: "리임버스", exampleEn: "The company will reimburse travel costs.", exampleKo: "회사가 출장비를 환급해 줍니다." }),
  word({ id: "p5-thorough", part: 5, word: "thorough", pos: "adjective", meaningKo: "철저한", ipa: "/ˈθɜːroʊ/", pronKo: "써로우", exampleEn: "They did a thorough inspection.", exampleKo: "그들은 철저한 점검을 했다." }),
  word({ id: "p5-promptly", part: 5, word: "promptly", pos: "adverb", meaningKo: "즉시, 정확히", ipa: "/ˈprɑːmptli/", pronKo: "프롬틀리", exampleEn: "Please reply promptly to the email.", exampleKo: "이메일에 즉시 답장해 주세요." }),

  word({ id: "p6-however", part: 6, word: "however", pos: "adverb", meaningKo: "그러나", ipa: "/haʊˈevər/", pronKo: "하우에버", exampleEn: "The plan is good; however, it is costly.", exampleKo: "계획은 좋지만, 비용이 많이 든다." }),
  word({ id: "p6-therefore", part: 6, word: "therefore", pos: "adverb", meaningKo: "그러므로", ipa: "/ˈðerfɔːr/", pronKo: "데어포어", exampleEn: "Sales rose; therefore, profits increased.", exampleKo: "매출이 올랐고, 그러므로 이익이 증가했다." }),
  word({ id: "p6-furthermore", part: 6, word: "furthermore", pos: "adverb", meaningKo: "게다가", ipa: "/ˈfɜːrðərmɔːr/", pronKo: "퍼더모어", exampleEn: "Furthermore, the service is free.", exampleKo: "게다가 그 서비스는 무료이다." }),

  word({ id: "p7-contract", part: 7, word: "contract", pos: "noun", meaningKo: "계약(서)", ipa: "/ˈkɑːntrækt/", pronKo: "칸트랙트", exampleEn: "Both parties signed the contract.", exampleKo: "양측이 계약서에 서명했다." }),
  word({ id: "p7-policy", part: 7, word: "policy", pos: "noun", meaningKo: "정책, 방침", ipa: "/ˈpɑːləsi/", pronKo: "팔러시", exampleEn: "The refund policy is printed on the receipt.", exampleKo: "환불 정책은 영수증에 인쇄되어 있다." }),
  word({ id: "p7-notice", part: 7, word: "notice", pos: "noun", meaningKo: "공고, 통지", ipa: "/ˈnoʊtɪs/", pronKo: "노티스", exampleEn: "A notice was posted on the door.", exampleKo: "문에 공고가 게시되었다." }),
];

// Prefer the bundled all-parts seed; fall back to the inline set offline-only
// if the seed file wasn't generated.
const WORDS: Word[] = seedWords.length ? seedWords : INLINE_WORDS;

const progress = (p: Word, i: number): Progress => ({ id: `p${i}`, wordId: p.id, word: p });

// A review session is a subset, not the whole corpus.
const DUE_LIMIT = 30;
const dueWords = WORDS.slice(0, DUE_LIMIT);

const partsCovered = new Set(WORDS.map((w) => w.part).filter(Boolean)).size || 7;

export const mockProgressStats: ProgressStat[] = [
  { state: "new", _count: { _all: Math.max(0, WORDS.length - dueWords.length) } },
  { state: "review", _count: { _all: dueWords.length } },
  { state: "learned", _count: { _all: partsCovered } },
];

export const mockDueQueue: Progress[] = dueWords.map(progress);

const PART_TITLE: Record<number, string> = {
  1: "Part 1 사진묘사 핵심 어휘",
  2: "Part 2 질의응답 핵심 어휘",
  3: "Part 3 대화 핵심 어휘",
  4: "Part 4 담화 핵심 어휘",
  5: "Part 5 문장완성 핵심 어휘",
  6: "Part 6 지문완성 핵심 어휘",
  7: "Part 7 독해 핵심 어휘",
};

export function mockLesson(lessonId: string): Lesson {
  // Accept "part-3" or the backend's "lesson-p3" → that part's words; else all.
  const m = /(?:part-|lesson-p)(\d+)/.exec(lessonId);
  const part = m ? Number(m[1]) : null;
  const words = part ? WORDS.filter((w) => w.part === part) : WORDS;
  return {
    id: lessonId,
    title: part ? PART_TITLE[part] : lessonId,
    part: part ?? undefined,
    words: words.map((w) => ({ wordId: w.id, word: w })),
  };
}

/** Lesson catalog — one starter lesson per part (mirrors the DB seed). */
export function mockLessons(): Lesson[] {
  const parts = Array.from(new Set(WORDS.map((w) => w.part).filter(Boolean))) as number[];
  return parts
    .sort((a, b) => a - b)
    .map((p) => {
      const words = WORDS.filter((w) => w.part === p).slice(0, 20);
      return {
        id: `lesson-p${p}`,
        title: PART_TITLE[p] ?? `Part ${p}`,
        part: p,
        orderIndex: p,
        words: words.map((w) => ({ wordId: w.id, word: w })),
      };
    });
}

// Guest (no progress) → not tested yet, so no segments. The donut shows an empty
// gray track + "테스트 완료 후 확인" note, consistent with the logged-in analysis.
export const mockAnalysis = {
  avgScore: 0,
  targetScore: 900,
  tested: false,
  segments: [] as { label: string; value: number; color: string }[],
};

function sentencesFor(path: string) {
  const m = /[?&]part=(\d+)/.exec(path);
  const part = m ? Number(m[1]) : null;
  const items = part ? seedSentences.filter((s) => s.part === part) : seedSentences;
  return { items, nextCursor: null };
}

function sentenceStats() {
  const byPart: Record<string, number> = {};
  for (const s of seedSentences) {
    const key = `P${s.part}`;
    byPart[key] = (byPart[key] ?? 0) + 1;
  }
  return { total: seedSentences.length, byPart };
}

/** GET /words[?part=N] — offline serves ALL bundled words of the part (no 20 cap). */
function mockWords(path: string) {
  const m = /[?&]part=(\d+)/.exec(path);
  const part = m ? Number(m[1]) : null;
  const items = part ? WORDS.filter((w) => w.part === part) : WORDS;
  return { items, nextCursor: null };
}

/** Resolve a mocked response for an API path, or null if unhandled. */
export function resolveMock(path: string, method: string): unknown | null {
  if (path === "/me/analysis") return mockAnalysis;
  if (path === "/words" || path.startsWith("/words?")) return mockWords(path);
  if (path === "/sentences/stats") return sentenceStats();
  if (path.startsWith("/sentences")) return sentencesFor(path);
  if (path === "/progress/stats") return mockProgressStats;
  if (path.startsWith("/progress/due")) return mockDueQueue;
  if (path === "/progress/grade" && method === "POST") return { ok: true };
  if (path === "/lessons" || path.startsWith("/lessons?")) return mockLessons();
  if (path.startsWith("/lessons/")) return mockLesson(path.slice("/lessons/".length));
  if (path === "/auth/login/email" && method === "POST")
    return { accessToken: "mock-token", user: { id: "mock", email: "demo@vnb4.local", role: "user", name: "데모" } };
  if (path === "/auth/signup/email" && method === "POST")
    return { accessToken: "mock-token", user: { id: "mock", email: "demo@vnb4.local", role: "user", name: "데모" } };
  if (path === "/users/me") return { id: "mock", email: "demo@vnb4.local", role: "user", name: "데모" };
  return null;
}
