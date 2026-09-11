// The evidence layer: does the loop you built actually work? Numbers, not vibes.
// Book §16.8, translated. Offline half: metrics. Live half: judge (needs the key).

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { rank } from "./retrieval.js"; // nodenext: the file is retrieval.TS — import paths say .js

process.loadEnvFile(".env");

// ---------- 1. The golden set: evaluation data is code, annotation is the human step ----------

interface GoldRow {
  q: string;
  relevant: number[]; // chunk indices a human judged relevant — by reading the corpus once
  expectRefusal?: true; // negative probe: nothing is relevant; the SYSTEM wins by refusing
}

// Annotated against chunkTexts(EXCERPT, 60, 12) — boundaries verified live:
// the chunker cuts mid-sentence (by design), so annotation is judgment, and judgment is yours.
const GOLDEN: GoldRow[] = [
  { q: "why must consecutive chunks share overlapping words", relevant: [2] },
  {
    q: "what three limitations come from storing knowledge in weights",
    relevant: [0, 1],
  }, // the list straddles both
  { q: "what does chunking do to documents", relevant: [1] },
  {
    q: "what does retrieval-augmented generation give to language models",
    relevant: [0],
  },
  { q: "what do Vogons think of poetry", relevant: [], expectRefusal: true }, // off-corpus control
];

// ---------- 2. Retrieval metrics (book eq. 16.22–16.24, translated) ----------

const rows = await Promise.all(
  GOLDEN.map(async (g) => ({ ...g, ranked: await rank(g.q) })),
);

console.log(
  "=== Level 1 — retrieval quality (deterministic: same corpus, model, cache) ===\n",
);

for (const row of rows) {
  const top3 = row.ranked
    .slice(0, 3)
    .map((r) => `${r.index}:${r.score.toFixed(3)}`)
    .join("  ");
  if (row.expectRefusal) {
    console.log(`negative probe: "${row.q}"`);
    console.log(
      `  top-3: ${top3} — flat; nothing is relevant, and the system wins by refusing\n`,
    );
    continue;
  }
  const positions = row.relevant.map(
    (i) => row.ranked.findIndex((r) => r.index === i) + 1,
  );
  console.log(`"${row.q}"`);
  console.log(
    `  gold ${row.relevant.join(", ")} at rank(s) ${positions.join(", ")}   top-3: ${top3}\n`,
  );
}

const scored = rows.filter((r) => !r.expectRefusal); // negative probes carry no retrieval score

// recall@k: of the chunks that ARE relevant, what share made the top-k?
const recallAt = (k: number) =>
  scored.reduce((sum, row) => {
    const topK = row.ranked.slice(0, k).map((r) => r.index);
    const hits = row.relevant.filter((i) => topK.includes(i)).length;
    return sum + hits / row.relevant.length;
  }, 0) / scored.length;

// precision@k: of the chunks you fed the model, what share was gold? (the over-retrieval tax)
const precisionAt = (k: number) =>
  scored.reduce((sum, row) => {
    const topK = row.ranked.slice(0, k).map((r) => r.index);
    const hits = row.relevant.filter((i) => topK.includes(i)).length;
    return sum + hits / k;
  }, 0) / scored.length;

// MRR: 1/rank of the FIRST gold chunk, averaged — position is rewarded, not just presence
const mrr =
  scored.reduce((sum, row) => {
    const first =
      row.ranked.findIndex((r) => row.relevant.includes(r.index)) + 1;
    return sum + 1 / first;
  }, 0) / scored.length;

console.log(
  `recall@1 = ${recallAt(1).toFixed(3)}    recall@2 = ${recallAt(2).toFixed(3)}    recall@3 = ${recallAt(3).toFixed(3)}`,
);
console.log(
  `precision@2 = ${precisionAt(2).toFixed(3)}    precision@3 = ${precisionAt(3).toFixed(3)}`,
);
console.log(`MRR = ${mrr.toFixed(3)}`);

// ---------- 3. Faithfulness (live): citation check + judge (book eq. 16.26) ----------

const client = new Anthropic();

console.log("=== Level 2 — generation quality: faithfulness (live) ===");

const judged = GOLDEN[0]; // the overlap question — the one you eyeballed in lesson 0005
const docs = (await rank(judged.q)).slice(0, 2); // top-2: recall@2 = 1.00, and precision beats k=3
const context = docs
  .map((d, i) => `[Doc ${i + 1}] (score ${d.score.toFixed(3)})\n${d.text}`)
  .join("\n\n");

const answerReply = await client.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 512,
  system:
    "You are a retrieval-augmented assistant. Answer the question using ONLY the " +
    "provided context documents. If the context does not contain enough information, " +
    "say so explicitly — do not use your own knowledge to fill gaps. Cite your sources " +
    "using [Doc N] notation.",
  messages: [
    {
      role: "user",
      content: `Context documents:\n\n${context}\n\nQuestion: ${judged.q}`,
    },
  ],
});
const answer = answerReply.content
  .filter((b): b is Anthropic.TextBlock => b.type === "text")
  .map((b) => b.text)
  .join("");

console.log(`question: ${judged.q}`);
console.log(`answer:\n${answer.trim()}\n`);

// 3a. citation integrity — the mechanical half, deterministic: every [Doc N] must resolve
const cited = [...answer.matchAll(/\[Doc (\d+)\]/g)].map((m) => Number(m[1]));
const dangling = cited.filter((n) => n < 1 || n > docs.length);
console.log(
  dangling.length === 0
    ? `citation check: ${cited.length} citation(s), all resolve to fed docs — pass`
    : `citation check: FAIL — [Doc ${dangling.join("], [Doc ")}] not among the ${docs.length} fed docs`,
);

// 3b. the judge — the semantic half: does each claim trace to the context? (eq. 16.26)
const judgeReply = await client.messages.create({
  model: "claude-haiku-4-5",
  max_tokens: 1024,
  system:
    "You are an evaluation judge. Given context documents and an answer, enumerate the answer's " +
    "distinct factual claims and decide for each whether the CONTEXT ALONE supports it. Respond with " +
    'ONLY a JSON object of shape {"claims":[{"claim":string,"supported":boolean}]} — no preamble, no trailing prose.',
  messages: [
    {
      role: "user",
      content: `Context documents:\n\n${context}\n\nAnswer: ${answer}\n\nEnumerate the claims.`,
    },
  ],
});
const judgeText = judgeReply.content
  .filter((b): b is Anthropic.TextBlock => b.type === "text")
  .map((b) => b.text)
  .join("");

// the judge's text is untrusted output at a new boundary: strip fences, parse, THEN zod —
// the lesson-0003 doctrine, third boundary (wire → seam → judge)
const JudgeVerdict = z.object({
  claims: z.array(z.object({ claim: z.string(), supported: z.boolean() })),
});
const verdict = JudgeVerdict.safeParse(
  (() => {
    try {
      return JSON.parse(
        judgeText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim(),
      );
    } catch (e) {
      throw new Error(
        `judge output is not JSON — got: ${judgeText.slice(0, 200)}`,
      );
    }
  })(),
);
if (!verdict.success)
  throw new Error(`judge output failed its schema: ${verdict.error.message}`);

// the judge enumerates; YOUR code divides. Never let the model do the metric's arithmetic.
const claims = verdict.data.claims;
const supported = claims.filter((c) => c.supported).length;
for (const c of claims) console.log(`  ${c.supported ? "✓" : "✗"} ${c.claim}`);
console.log(
  `\nfaithfulness = ${supported}/${claims.length} = ${(supported / claims.length).toFixed(2)} (eq. 16.26)`,
);
