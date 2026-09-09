// The G arrives. Retrieval (lesson 0004) meets generation (lessons 0002–0003):
// chunks -> zod-checked seam -> grounded prompt with [Doc N] citations -> Claude.
// This file IS the capstone in miniature — at four paragraphs instead of 636 pages,
// the only difference between here and there is scale.
// Live: needs ANTHROPIC_API_KEY. Two haiku-class calls, pennies.

import { Anthropic } from "@anthropic-ai/sdk";
import { pipeline } from "@huggingface/transformers";
import { z } from "zod";

process.loadEnvFile(".env");
const client = new Anthropic();

// ---------- retrieval layer: lesson 0004, third typing — retrieval is remembering ----------

const EXCERPT = [
  "Retrieval-Augmented Generation equips large language models with a dynamic, updatable external memory, enabling accurate, grounded, and verifiable responses across knowledge-intensive tasks.",
  "Large language models store knowledge parametrically, compressed into billions of weights during training. This creates three fundamental limitations: hallucination, where models confidently generate plausible but incorrect statements beyond their reliable knowledge boundary; knowledge staleness, because training data has a cutoff date; and domain specificity, since general-purpose models lack deep knowledge of proprietary codebases and documents.",
  "Chunking is the process of splitting documents into segments that are small enough to fit in an embedding model's context window, semantically coherent, and containing enough context to be useful when retrieved in isolation.",
  "The simplest strategy splits every W tokens with an overlap of O tokens between consecutive chunks. Overlap preserves context across boundaries: a sentence cut at a chunk edge still appears whole inside its neighbour chunk, so retrieval never loses a thought merely because a window ended mid-thought.",
].join("\n\n");

function chunkTexts(text: string, size: number, overlap: number): string[] {
  if (overlap >= size)
    throw new Error(`overlap (${overlap}) must be smaller than size (${size})`);
  const words = text.split(/\s+/).filter(Boolean);
  const step = size - overlap;
  const out: string[] = [];
  for (let start = 0; start < words.length; start += step) {
    const window = words.slice(start, start + size);
    if (window.length === 0) break;
    out.push(window.join(" "));
    if (start + size >= words.length) break;
  }
  return out;
}

function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
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

const embedder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);

async function embed(text: string): Promise<Float32Array> {
  const tensor = await embedder(text, { pooling: "mean", normalize: true });
  return tensor.data as Float32Array;
}

const chunks = chunkTexts(EXCERPT, 60, 12);
const chunkVectors = await Promise.all(chunks.map(embed));

// top-k, not top-threshold: cosine scores have no absolute meaning across queries or
// models — only the RANKING is dependable, so "best 3" is a knob, "score > 0.4" is a bug.
const TOP_K = 3;

async function retrieve(
  query: string,
): Promise<{ text: string; score: number; index: number }[]> {
  const queryVector = await embed(query);
  return chunks
    .map((text, index) => ({
      text,
      score: cosine(queryVector, chunkVectors[index]),
      index,
    }))
    .sort((x, y) => y.score - x.score)
    .slice(0, TOP_K);
}

// ---------- the seam: retrieval output becomes prompt input (zod, lesson 0003's doctrine) ----------
const RetrievedChunk = z.object({
  text: z.string(),
  score: z.number(),
  index: z.number(),
});
type Retrieved = z.infer<typeof RetrievedChunk>;

function asRetrieved(raw: unknown): Retrieved[] {
  // safeParse at the seam, exactly like lesson 0003's parseReply: the prompt builder
  // downstream depends on this shape — the schema is the contract, checked.
  const parsed = z.array(RetrievedChunk).safeParse(raw);
  if (!parsed.success)
    throw new Error(
      `retriever output failed its own schema: ${parsed.error.message}`,
    );
  return parsed.data;
}

// ---------- the grounded prompt: book §16.2.4, translated ----------
function buildGroundedPrompt(query: string, docs: Retrieved[]) {
  const context = docs
    .map((d, i) => `[Doc ${i + 1}] (score ${d.score.toFixed(3)})\n${d.text}`)
    .join("\n\n");
  return {
    system:
      "You are a retrieval-augmented assistant. Answer the question using ONLY the " +
      "provided context documents. If the context does not contain enough information, " +
      "say so explicitly — do not use your own knowledge to fill gaps. Cite your sources " +
      "using [Doc N] notation.",
    user: `Context documents:\n\n${context}\n\nQuestion: ${query}`,
  };
}

// ---------- the loop, closed: ask, retrieve, ground, generate ----------
const QUESTIONS = [
  "why must consecutive chunks share overlapping words", // on-corpus: expect [Doc N] citations
  "what do Vogons think of poetry", // off-corpus: expect an honest "not in the context"
];

for (const question of QUESTIONS) {
  const docs = asRetrieved(await retrieve(question)); // the seam, checked
  const prompt = buildGroundedPrompt(question, docs);

  const reply = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: prompt.system,
    messages: [{ role: "user", content: prompt.user }],
  });

  const answer = reply.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  console.log(`\n${"=".repeat(72)}\nQ: ${question}`);
  console.log(
    `fed the model ${docs.length} chunks: ${docs.map((d, i) => `[Doc ${i + 1}] ${d.score.toFixed(3)}`).join("  ")}`,
  );
  console.log(`-${"".padEnd(70, "-")}`);
  console.log(answer.trim());
}
