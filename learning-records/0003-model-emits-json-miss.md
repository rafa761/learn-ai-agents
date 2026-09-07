# Missed Q3 (lesson 0002 quiz): "the model emits data, you dispatch it" not yet reflexive

Lesson-0002 quiz (2026-09-07): 4/5 first-attempt. The single miss was the tool-call mental-model question — he did not retrieve that a `tool_use` block is *data* (a name plus JSON input) and reached for a distractor implying runtime linkage (function pointer / RPC handshake / linked module; which one is unknown — the report lists only the correct answer).

**Evidence:** self-reported first-attempt result; per-question map in his browser under `learn-ai-agents:lesson0002`.

**Implications:** this is the load-bearing wall of the entire course — the wire carries only JSON; the validate-and-dispatch layer living in *his* process is the agent harness. Lesson 0003 (zod at the boundary + official SDK types) industrializes exactly that layer, so the miss lands at the perfect teaching moment: zod's `.parse()` *is* the "validate the JSON you dispatched" step, made typed. Q3 must be interleaved — re-asked verbatim — in lesson 0003's quiz.

**Spacing evidence (positive):** Q4 from LR-0002, interleaved into this quiz after one session's gap, was retrieved correctly on first attempt. The interleave strategy is working; expand Q4's interval — next return ≈ lesson 0005, not 0003.
