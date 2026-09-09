# Missed Q4 (lesson 0001 quiz): the unknown / narrowing discipline is not yet retrievable

Session-1 quiz (2026-09-07): 4/5 first-attempt. The single miss was the trust-boundary question — the type-safe move for a value the compiler cannot vouch for (`JSON.parse` output) was not retrieved as "narrow it first".

**Evidence:** self-reported first-attempt result; stored in his browser under `learn-ai-agents:lesson0001` (per-question first-try map).

**Implications:** this is *the* safety habit of agent engineering — a model's tool-call arguments arrive as untrusted JSON and must be narrowed (typeof / type guard / zod) before execution. Lesson 0002 (live API round-trip) must make Rafael hand-narrow a real `res.json()` value from `unknown`, and Q4 must be interleaved — re-asked verbatim — in lesson 0002's quiz for spaced retrieval.

**Course correction:** lesson 0001's Q4 originally said JSON.parse "hands you a value typed unknown" — imprecise. The lib signature returns `any`; parking it in `unknown` is the disciplined move the learner makes. Question and explanation updated on 2026-09-07.

**Spacing evidence (positive, 2026-09-08):** Q4 interleaved into lesson 0005's quiz at its first expanded interval (two lessons between returns) was retrieved correctly on first attempt — second consecutive correct. Interval expands again: next return ≈ lesson 0010; retire on a correct there.
