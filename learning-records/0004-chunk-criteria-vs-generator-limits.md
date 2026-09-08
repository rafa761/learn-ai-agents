# Missed Q5 (lesson 0004 quiz): chunk criteria vs. generator limits not yet disentangled

Lesson-0004 quiz (2026-09-08): 4/5 first-attempt. The single miss was the EXCEPT question — the odd-one-out among chunk-formation constraints. He did not retrieve that "respect the generator model's output token limit" is the NON-criterion; the three real criteria (book §16.4) are: (1) fit the embedding model's context window, (2) semantic coherence, (3) usefulness in isolation. Which distractor he chose is unknown (the report lists only the correct answer) — but the plausible conflation is "chunks are sent to the LLM, LLMs have token limits, therefore chunks obey a generator limit."

**Evidence:** self-reported first-attempt result; per-question map in his browser under `learn-ai-agents:lesson0004`.

**The distinction to install:** three different limits, three different owners —
- Embedding-model window → shapes the chunk (criterion 1).
- Generator INPUT context budget → does NOT shape individual chunks, but caps how many retrieved chunks fit in the prompt. Real constraint, wrong level — it's a retrieval-budget concern (lesson 0005 material).
- Generator OUTPUT limit → caps the *answer's* length. Nothing to do with chunks at all.

The EXCEPT format itself is also a hazard (negation questions cost working memory), but the durable fix is knowing the three criteria cold, not test-craft.

**Implications:** the miss lands one lesson early — 0005 opens with exactly this budget: retrieved chunks ride IN the prompt, their total is the context budget, and the grounded-answer prompt (book §16.2.4) is where generator-side limits finally appear. Q5 must be interleaved — re-asked verbatim — in lesson 0005's quiz (joining the already-scheduled Q4 return from LR-0002; 0005's quiz will carry two interleaves).

**Standing scheduling after this session:** Q4 (LR-0002) returns ≈ lesson 0005 · Q5 (this LR) returns lesson 0005 · Q3 (LR-0003) returns ≈ lesson 0006.
