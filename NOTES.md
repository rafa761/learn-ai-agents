# NOTES.md — teaching working notes

## Learner profile (2026-09-07)
- Rafael, Senior Python developer (deep: types-adjacent Python — pydantic/asyncio idioms land well).
- Earned **Claude Architect Foundation certification** ~2026-09-05. Knows Claude ecosystem concepts, MCP at a conceptual level, prompting. Do NOT re-teach agent vocabulary from scratch — treat as known floor.
- TypeScript: no claimed experience. JavaScript itself is also new — do not assume JS fluency when choosing TS docs (prefer "TS for the New Programmer" entry, not "TS for JavaScript Programmers").
- Native pt-BR; works in English. Lessons written in English (his request language).

## Preferences & style
- Wants to *build* (learn-by-construction). Video roadmap + book as anchors; lessons should always end in working code he ran himself.
- Persona for the assistant: JARVIS (see global CLAUDE.md) — irrelevant to lesson content, but keep chat tone consistent.

## Environment facts
- Book PDF: `~/Documents/Livros/AI engineering/book-The Hitchhiker's Guide to Agentic AI - 2026.pdf` (note the Unicode apostrophe ’ in filename — always quote). 636 pp, v1.3, arXiv:2606.24937v2. Text extractable via `pdftotext` (done once to /tmp/opencode/hhgtg-full.txt; regenerate when needed).
- Also in ~/Downloads: "The AI Engineering Bible" EPUB (unrelated download, not the roadmap book; possible secondary resource later).
- Repo: branch `learning/ai-agents-ts` (main is protected by house rule — never write on main).
- Roadmap video identified: "How I'd Become an AI Engineer in 2026 (Even with No CS Degree)" (youtube 8c8Rrhd2oxo, playlist PLUs4VCkQzu7t9kdyCaSN1r6M2IwDfDScj). Channel not yet identified.

## Course architecture decisions
- Book chapters mapped to mission: skip Parts II–III (RL training). Core: ch. 15 (agentic intro), 16 (RAG), 18 (agent harness), 19 (loop engineering), 20 (design patterns), 22 (MCP), 23 (agent skills), 25 (multi-agent), 26 (frameworks), 27 (agentic UI, incl. Vercel AI SDK §27.4).
- Book's code listings are Python/LangChain → every lesson translates to TS. The phrasebook (reference/) is the standing bridge.
- Lesson cadence: one tight lesson per session, always with (a) a runnable win that works offline, (b) a quiz (storage-strength focus), (c) a primary-source citation, (d) stretch with real API when key available.
- MCP currency warning: SDK v2 renamed packages to @modelcontextprotocol/server + @modelcontextprotocol/client (2026-07-28 spec). Pre-v2 tutorials show dead imports — warn whenever MCP comes up.

## Decisions (resolved in session-1 follow-up)
- **Capstone: CONFIRMED** — RAG document-Q&A agent over the Hitchhiker's Guide itself.
- **API keys available:** `ANTHROPIC_API_KEY` **and** a GLM/Z.AI key. Lesson 0002 runs live round-trips; GLM's Anthropic-compatible endpoint is a candidate second model for cost/comparison exercises.
- `.omo/` ignored in git — runtime state, not course material.

## Session log
- **2026-09-07 (session 1):** Workspace bootstrapped on branch `learning/ai-agents-ts`. Created MISSION.md, RESOURCES.md (37 verified sources via librarian agent), assets (course.css, quiz.js), reference phrasebook, Lesson 0001. Quiz state keyed `learn-ai-agents:lesson0001` in localStorage.
- **2026-09-07 (session 2):** Lesson 0001 completed — quiz 4/5 first-attempt; sole miss = Q4 (unknown/narrowing). Recorded in LR-0002; Q4 to be interleaved verbatim into lesson 0002's quiz. quiz.js upgraded: final summary now enumerates misses (Q# + correct answer) and renders instantly on reopening a completed quiz. Learner preference captured: wants miss summaries, not just scores. Lesson Q4 wording corrected (JSON.parse is declared `any`; parking in `unknown` is the learner's move).
- **2026-09-07 (session 3):** Lesson 0002 authored — "The agent loop, live": raw-fetch agent loop (no SDK) with hand-written type guards (`isTextBlock`/`isToolUseBlock`/`parseReply`) fulfilling LR-0002's hand-narrowing requirement; Q4 interleaved verbatim (verified byte-equal). New reference doc `reference/anthropic-tool-loop.html` (wire cheat sheet, incl. the live-verified 400 message). Lab verified end-to-end before publishing: tsc clean + live run (model made 2 parallel tool calls in one hop, finished in 2 hops) + break-it 400 confirmed. Environment discoveries baked into lab steps: npm now installs **TypeScript 7** whose `tsc --init` template pins `"types": []` (must set `["node"]` or `process` is unknown) and defaults `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes` ON; `npm pkg set type=module` required for top-level await; `npx tsx --env-file=../../.env` forwarding works. Repo-root `.env` (ANTHROPIC_API_KEY + ZAI_API_KEY) is the lab's key source. Anthropic docs domain migrated to platform.claude.com (docs.anthropic.com redirects). Lesson 0001 next-nav converted to live link. Book text regenerated at /tmp/opencode/hhgtg-full.txt (evaporates on reboot; regenerate via pdftotext — mind the Unicode ’ in the filename). 0003 commissioned: zod at the boundary + official SDK types (book ch. 18).
