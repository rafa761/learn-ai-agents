// Slice the book before you can search the book — chunking.
// Translation of Roitman 2026, Listing 16.2 (LangChain's RecursiveCharacterTextSplitter)
// into plain TypeScript: a word window that advances by (size - overlap), plus the
// cosine-similarity function you will need to rank embeddings in part two.
// Offline: no API, no key, no network — pure data-structure work.

import assert from "node:assert/strict";

// ---------- 1. The corpus: real text from the book itself (ch. 16, lightly adapted) ----------
// Four paragraphs, ~180 words — small enough to eyeball, real enough to matter.
// (The capstone RAGs over this entire book; today it RAGs over its chunking chapter.
// There is a school of thought that says this is recursive. There is.)
const EXCERPT = [
  "Retrieval-Augmented Generation equips large language models with a dynamic, updatable external memory, enabling accurate, grounded, and verifiable responses across knowledge-intensive tasks.",
  "Large language models store knowledge parametrically, compressed into billions of weights during training. This creates three fundamental limitations: hallucination, where models confidently generate plausible but incorrect statements beyond their reliable knowledge boundary; knowledge staleness, because training data has a cutoff date; and domain specificity, since general-purpose models lack deep knowledge of proprietary codebases and documents.",
  "Chunking is the process of splitting documents into segments that are small enough to fit in an embedding model's context window, semantically coherent, and containing enough context to be useful when retrieved in isolation.",
  "The simplest strategy splits every W tokens with an overlap of O tokens between consecutive chunks. Overlap preserves context across boundaries: a sentence cut at a chunk edge still appears whole inside its neighbour chunk, so retrieval never loses a thought merely because a window ended mid-thought.",
].join("\n\n");

// ---------- 2. Fixed-size chunking with overlap (the Listing 16.2 core) ----------
// Book units are tokens; we chunk words — same mechanics, one honest simplification.
// The book's overlap formula (16.19):  N_chunks = ceil((L - O) / (W - O)).

interface Chunk {
  index: number;
  words: string[];
  text: string;
}

export function chunkWords(
  text: string,
  size: number,
  overlap: number,
): Chunk[] {
  if (overlap >= size) {
    // step = size - overlap <= 0 would never advance the window: infinite loop,
    // caught here instead. LangChain raises for the same misconfiguration.
    throw new Error(`overlap (${overlap}) must be smaller than size (${size})`);
  }
  const words = text.split(/\s+/).filter(Boolean);
  const step = size - overlap;
  const chunks: Chunk[] = [];
  for (let start = 0; start < words.length; start += step) {
    const window = words.slice(start, start + size);
    if (window.length === 0) break;
    chunks.push({
      index: chunks.length,
      words: window,
      text: window.join(" "),
    });
    if (start + size >= words.length) break; // this window already covered the tail
  }
  return chunks;
}

// ---------- 3. Cosine similarity, by hand (book eq. 16.3) ----------
// sim(q, e) = (q . e) / (|q| * |e|)  — the angle between vectors, magnitudes cancelled.

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ---------- 4. Prove the machinery before trusting it ----------

// 4a. Cosine on vectors you can check by hand.
assert.equal(cosine([1, 0, 0], [0, 1, 0]), 0); // orthogonal -> 0
assert.equal(cosine([2, 0, 0], [7, 0, 0]), 1); // same direction, any magnitude -> 1
assert.equal(cosine([1, 0, 0], [-1, 0, 0]), -1); // opposite -> -1
assert.equal(cosine([3, 4], [4, 3]), 24 / 25); // 0.96: angle shrinks, not lengths

// 4b. The chunker on a controlled document: L = 11 words, W = 4, O = 1.
const tiny = "one two three four five six seven eight nine ten eleven";
const tinyChunks = chunkWords(tiny, 4, 1);
// Formula: ceil((11 - 1) / (4 - 1)) = ceil(3.33) = 4 — and the loop agrees:
assert.equal(tinyChunks.length, Math.ceil((11 - 1) / (4 - 1)));
assert.equal(tinyChunks.length, 4);
assert.deepEqual(tinyChunks[0].words, ["one", "two", "three", "four"]);
assert.deepEqual(tinyChunks[1].words, ["four", "five", "six", "seven"]); // 'four' = the overlap
assert.deepEqual(tinyChunks[2].words, ["seven", "eight", "nine", "ten"]); // 'seven' = the overlap
assert.deepEqual(tinyChunks[3].words, ["ten", "eleven"]); // ragged tail: short final window

// 4c. The invariant that makes overlap safe: each chunk begins with the previous
// chunk's step-tail — no word sequence is ever lost at a boundary.
for (let i = 0; i + 1 < tinyChunks.length; i++) {
  const expected = tinyChunks[i].words.slice(4 - 1); // last `step` words of chunk i
  assert.deepEqual(tinyChunks[i + 1].words.slice(0, expected.length), expected);
}

// 4d. Misconfiguration fails loudly, not silently.
assert.throws(() => chunkWords(tiny, 50, 50), /overlap/);

console.log(
  "all assertions green — cosine and chunker behave exactly as specified\n",
);

// ---------- 5. Chunk the real excerpt (factoid-QA sizing from Table 16.3, in words) ----------
const SIZE = 60;
const OVERLAP = 12;
const chunks = chunkWords(EXCERPT, SIZE, OVERLAP);
const wordCount = EXCERPT.split(/\s+/).filter(Boolean).length;

console.log(
  `excerpt: ${wordCount} words -> ${chunks.length} chunks (W=${SIZE}, O=${OVERLAP})`,
);
console.log(
  `formula check: ceil((${wordCount} - ${OVERLAP}) / (${SIZE} - ${OVERLAP})) = ` +
    `${Math.ceil((wordCount - OVERLAP) / (SIZE - OVERLAP))}\n`,
);

for (const c of chunks) {
  const head = c.words.slice(0, 6).join(" ");
  const tail = c.words.slice(-6).join(" ");
  console.log(
    `chunk ${c.index}: ${c.words.length} words | "${head} ... ${tail}"`,
  );
}
