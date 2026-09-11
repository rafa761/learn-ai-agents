// Lesson 0004's retrieval core, fourth typing — and its promotion to a MODULE.
// One deliberate interface change from lesson 0005: rank() returns the FULL ranking,
// because evaluation must measure every k — the k you ship is just one slice of it.
// Offline: the embedding model is local — this file never touches the network.

import { pipeline } from "@huggingface/transformers";

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

export interface RankedChunk {
  text: string;
  score: number;
  index: number; // position in `chunks` — the identity the golden set refers to
}

/** All chunks for one query, best first. Callers slice their own top-k. */
export async function rank(query: string): Promise<RankedChunk[]> {
  const queryVector = await embed(query);
  return chunks
    .map((text, index) => ({
      text,
      score: cosine(queryVector, chunkVectors[index]),
      index,
    }))
    .sort((x, y) => y.score - x.score);
}
