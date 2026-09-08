// The E in RAG — and the R. The chunks from Lab A go through a real embedding
// model running ON YOUR MACHINE (Xenova/all-MiniLM-L6-v2, 384 dims, ~25 MB,
// CPU-only via transformers.js), and a plain-English query retrieves by meaning.
// No API key, no request, no cost. The first-ever run downloads the model into
// node_modules/@huggingface/transformers/.cache; every later run is offline.

import { pipeline } from "@huggingface/transformers";

// ---------- corpus + chunker: same ones you proved correct in Lab A ----------
// (Retyped compact. Deliberately: retrieval is remembering.)

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

// Book eq. 16.3, same function you tested in Lab A. Note what normalization does:
// the pipeline below emits unit-length vectors, so |q| * |e| = 1 and cosine
// reduces to a plain dot product. The formula stays honest either way.
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

// ---------- the embedding function: model + mean pooling + normalize ----------

const embedder = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
);

async function embed(text: string): Promise<Float32Array> {
  const tensor = await embedder(text, { pooling: "mean", normalize: true });
  return tensor.data as Float32Array; // [1, 384] flattened — one vector per text
}

// ---------- index once, then retrieve ----------

const chunks = chunkTexts(EXCERPT, 60, 12);
console.log(`corpus: ${chunks.length} chunks, embedding...`);
const chunkVectors = await Promise.all(chunks.map(embed));
console.log(
  `indexed: ${chunkVectors.length} vectors of ${chunkVectors[0].length} dims\n`,
);

const QUERIES = [
  "why must consecutive chunks share overlapping words",
  "why do language models hallucinate facts",
  "vogon poetry appreciation society", // control: nothing like this is in the corpus
];

for (const query of QUERIES) {
  const queryVector = await embed(query);
  const ranked = chunks
    .map((text, i) => ({ text, score: cosine(queryVector, chunkVectors[i]) }))
    .sort((x, y) => y.score - x.score);
  console.log(`Q: ${query}`);
  for (const [rank, hit] of ranked.slice(0, 3).entries()) {
    console.log(
      `  ${rank + 1}. [${hit.score.toFixed(3)}] ${hit.text.slice(0, 86)}...`,
    );
  }
  console.log();
}
