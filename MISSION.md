# Mission: AI Engineer by Construction — Agents & RAG in TypeScript

## Why
Become an AI engineer by shipping, not by collecting certificates. Extend the Claude Architect Foundation cert (concepts) into working software: production-minded AI agents with RAG, built in TypeScript, using ten years of senior Python as the transfer layer instead of starting from zero.

## Success looks like
- Read real-world TypeScript agent code (MCP servers, Vercel AI SDK apps, SDK internals) fluently, without translate-back-to-Python friction.
- Build an agent loop from scratch in TypeScript: typed messages, tool dispatch, error states, compiler-enforced exhaustiveness.
- Implement a RAG pipeline in TypeScript end-to-end: chunking → embeddings → vector store → retrieval → grounded answers with citations.
- Ship one capstone: a document-Q&A agent with RAG over the Hitchhiker's Guide itself (confirmed, session 1).
- Justify every design choice with citations to primary sources (Anthropic engineering, official docs, the book).

## Constraints
- Self-paced study alongside a full-time job.
- TypeScript is learned *in service of* agents, always — dual-track, never a detour into abstract language exercises.
- The primary book (Roitman 2026, arXiv:2606.24937) presents code in Python: concepts come from the book, implementations are TypeScript — translation is the pedagogy.
- Free/official resources only; the book is already owned (local PDF + arXiv).
- PDFs cannot be read directly by the agent's model — use `pdftotext` extraction when the book's text is needed.

## Out of scope (for now)
- Model training and fine-tuning (book Part II–III: RLHF, GRPO, reward models) — consumer of models, not trainer. Revisit if the mission shifts toward applied fine-tuning.
- Frontend/UI beyond what an agent surface requires.
- Python agent frameworks as deliverables (LangChain-py etc. are for concept transfer only).
