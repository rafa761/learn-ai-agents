# Agents & RAG in TypeScript — Resources

Curated, annotated, verified. All URLs fetched live on 2026-09-07 unless marked ⚠️.
Prune ruthlessly as the course progresses; a resource that goes stale comes off this list.

## Knowledge

### Program anchors

- [Book: _The Hitchhiker's Guide to Agentic AI: From Foundations to Systems_ — Haggai Roitman (arXiv:2606.24937)](https://arxiv.org/abs/2606.24937)
  The program's primary book. Free, CC BY-SA 4.0 practitioner's reference (v2, 2026-07-27) by a Principal Applied Scientist at Amazon. Foundations → RL for LMs → agentic AI (RAG ch. 16, harness ch. 18, loops ch. 19, design patterns ch. 20, MCP ch. 22, multi-agent ch. 25, frameworks ch. 26, agentic UI ch. 27) → production. Code listings in Python — our course translates them to TS. Local PDF: `~/Documents/Livros/AI engineering/`. Use for: concept chapters cited in every lesson.
- [Video: "How I'd Become an AI Engineer in 2026 (Even with No CS Degree)"](https://www.youtube.com/watch?v=8c8Rrhd2oxo&list=PLUs4VCkQzu7t9kdyCaSN1r6M2IwDfDScj&index=11)
  The roadmap video this course was commissioned from. ⚠️ Title verified live; channel not yet identified.

### TypeScript foundations (from Python)

- [The TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
  Canonical entry point. Use for: the reference reading order after the intros.
- [TypeScript for the New Programmer](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)
  The right first page for a Python-native learner — does not assume JavaScript fluency.
- [TypeScript for JavaScript Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
  Fast tour of the type layer once JS basics land. Updated Aug 2026.
- [Handbook: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
  The types written daily; maps directly onto Python type hints.
- [Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
  The single biggest mental shift from Python; the pattern behind all agent message handling. Lesson 0001's primary source.
- [Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
  `Partial`, `Pick`, `Record` — appear in every TS agent-framework API.
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
  The JS layer under TS. ⚠️ Stable URL, not re-fetched. Use for: JS-only gaps (var/hoisting, `this`, prototypes) when they surface.
- [TypeScript / Python Rosetta Stone (Javier Candeira, gist)](https://gist.github.com/candeira/7d7a2e8a581607eaa9a591f138593631)
  Side-by-side Python↔TS including asyncio↔Promises. Best Python-native bridge found; no official equivalent exists.
- [zod docs](https://zod.dev)
  The pydantic of TypeScript. Use for: runtime validation at trust boundaries (LLM outputs, API responses).

### Building LLM agents (concept-first, official)

- [Anthropic — Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
  The canonical conceptual piece: workflows vs agents, the five composition patterns, tool-design principles. Read before touching any framework.
- [Anthropic — Writing Effective Tools for Agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
  Tool design in practice: token efficiency, response formats, namespacing, evals. The sequel to the above.
- [Anthropic — Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
  Context as a finite resource: compaction, note-taking, sub-agents, just-in-time retrieval. The RAG↔agentic-search bridge.

### Building LLM agents (TypeScript frameworks)

Reading order for this course: Anthropic posts → Vercel AI SDK → Claude Agent SDK → the rest as comparison.

- [Vercel AI SDK — Agents docs](https://ai-sdk.dev/docs/agents/overview)
  The most popular TS AI toolkit; docs track v7 (`ToolLoopAgent`, workflows, MCP tools, embeddings/reranking). Our default build-stack candidate.
- [Claude Agent SDK — TypeScript reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
  Anthropic's own TS agent runtime (`@anthropic-ai/claude-agent-sdk`). Natural fit given the Claude cert.
- [MCP Quickstart — Build a server (TypeScript tab)](https://modelcontextprotocol.io/quickstart/server)
  Official first MCP server in TS; current with the 2026-07-28 spec.
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) · [v2 docs site](https://ts.sdk.modelcontextprotocol.io/v2/)
  **Currency warning:** v2 renamed packages to `@modelcontextprotocol/server` / `client` — pre-2026 tutorials show dead `@modelcontextprotocol/sdk` imports.
- [Mastra docs](https://mastra.ai/docs)
  TypeScript-first agent framework — agents, `createTool`, workflows, Studio. Good second opinion.
- [OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/)
  Handoffs, guardrails, sessions, tracing, MCP — the OpenAI-flavored comparison point.
- [LangChain.js docs](https://docs.langchain.com/oss/javascript)
  The JS/TS surface, now centered on Deep Agents. Heavier abstraction; read last.

### RAG fundamentals (primary sources)

- [Anthropic — Introducing Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)
  The RAG-technique paper: contextual embeddings + BM25 + reranking, −49%/−67% retrieval failures. Core reading for our RAG module.
- [Anthropic — Contextual Embeddings cookbook](https://platform.claude.com/cookbook/capabilities-contextual-embeddings-guide)
  Runnable implementation of the above.
- [Pinecone Learning Center — Retrieval-Augmented Generation](https://www.pinecone.io/learn/retrieval-augmented-generation/)
  Clearest end-to-end RAG explainer: ingestion → retrieval → augmentation → generation, incl. agentic RAG. Updated Jun 2025.
- [Pinecone — Chunking Strategies](https://www.pinecone.io/learn/chunking-strategies/)
  The tactical layer: chunk size, boundaries, overlap.
- [OpenAI — Vector embeddings guide](https://platform.openai.com/docs/guides/embeddings)
  Plain-language embeddings with code samples incl. TypeScript.
- [LlamaIndex — Introduction to RAG](https://docs.llamaindex.ai/python/framework/understanding/rag/)
  Framework-level RAG pipeline walk; concepts transfer to TS. (Their TS port is secondary.)

## Wisdom (Communities)

- [Claude / Anthropic Discord](https://discord.com/invite/anthropic) (gateway: [claude.com/community](https://claude.com/community))
  Official Anthropic community: API announcements, agent/Claude Code channels, staff participation. First stop given the cert.
- [Latent Space Discord](https://discord.gg/xJJMRaWCRt) (invite from [latent.space/p/community](https://www.latent.space/p/community))
  Highest-signal AI-engineer community (~11k): agent builders, paper club. The newsletter/podcast ([latent.space](https://www.latent.space/)) is the staying-current arm.
- [TypeScript Discord](https://discord.gg/typescript)
  Official TS community chat (linked from typescriptlang.org footer). Language questions.
- [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/)
  Model releases, local inference, benchmarks. High volume, strong technical core. ⚠️ Not re-fetched.
- [r/AI_Agents](https://www.reddit.com/r/AI_Agents/)
  Agent chatter and tool announcements; more hype, lower moderation. Skim, don't trust. ⚠️ Not re-fetched.

## Gaps

- **No official "TypeScript for Python developers" page exists** (TS docs cover JS/Java-C#/functional variants only). The Candeira gist + our own phrasebook fill this; the phrasebook is now the canonical in-course reference.
- **No book-grade TypeScript RAG tutorial** among primary sources — the ecosystem teaches RAG in Python. Our course builds it ourselves (that *is* the mission), citing Anthropic/Pinecone/OpenAI primary material.
- **Roadmap video channel** unidentified — verify before citing in lessons beyond session references.
