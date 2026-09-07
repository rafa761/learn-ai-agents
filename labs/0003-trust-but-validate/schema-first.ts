// Trust, but validate — your hand-rolled guards retire into zod schemas.
// Offline: fabricated model output, no API key needed. The whole point:
// the ~90 lines of interfaces + type guards in labs/0002 become schemas,
// and the types fall out of the schemas.

import { z } from "zod";

// ---------- 1. Schemas replace interfaces ----------

const TextBlock = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const ToolUseBlock = z.object({
  type: z.literal("tool_use"),
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()), // untrusted forever
});

// Same discriminated union you wrote by hand in 0001 — zod builds it.
const ContentBlock = z.discriminatedUnion("type", [TextBlock, ToolUseBlock]);

// Envelope, checked strictly: if THIS fails, the API changed under us.
const ModelReply = z.object({
  stop_reason: z.string(),
  content: z.array(z.unknown()),
});

// The TYPE comes from the schema — one source of truth, not two.
type Block = z.infer<typeof ContentBlock>;
// And types compose like schemas: envelope stop_reason + narrowed blocks.
type Reply = {
  stop_reason: z.infer<typeof ModelReply>["stop_reason"];
  content: Block[];
};

// ---------- 2. What dispatch requires: an args schema ----------

const GuideArgs = z.object({
  topic: z.string(),
});

// ---------- 3. parse vs safeParse: closed world vs open world ----------

function parseReply(raw: unknown): Reply {
  const reply = ModelReply.parse(raw); // envelope: parse() THROWS — that's a bug in OUR transport
  const blocks = reply.content.flatMap((b) => {
    const r = ContentBlock.safeParse(b); // blocks: safeParse — the model's output is open world
    return r.success ? [r.data] : []; // blocks we don't model (thinking, ...) are dropped, not trusted
  });
  return { stop_reason: reply.stop_reason, content: blocks };
}

// ---------- 4. The tool + dispatch: ZodError becomes a tool_result ----------

const GUIDE_ENTRIES: Record<string, string> = {
  towel:
    "About the most massively useful thing an interstellar hitchhiker can have: warmth, shade, " +
    "a weapon, a sail. Carrying one signals to strags that you know where your towel is.",
  "babel fish":
    "Small, yellow, leech-like, and probably the oddest thing in the Universe.",
  "forty two":
    "The Answer to Life, the Universe and Everything. Nobody knows the Question.",
};

function runTool(name: string, input: unknown): string {
  switch (name) {
    case "lookup_guide_entry": {
      const args = GuideArgs.safeParse(input); // input arrives as unknown — ALWAYS
      if (!args.success) {
        // Not an exception — a RESULT. The model reads this and self-corrects.
        return `error: invalid arguments\n${z.prettifyError(args.error)}`;
      }
      const key = args.data.topic.trim().toLowerCase(); // args.data.topic: string — proven
      return GUIDE_ENTRIES[key] ?? `No Guide entry for "${args.data.topic}".`;
    }
    default:
      return `error: unknown tool "${name}"`;
  }
}

// ---------- 5. Proof: five blocks walk in, schemas sort them out ----------

const fakeReply: unknown = {
  stop_reason: "tool_use",
  content: [
    { type: "text", text: "Let me look that up." },
    {
      type: "tool_use",
      id: "toolu_01",
      name: "lookup_guide_entry",
      input: { topic: "towel" },
    },
    {
      type: "tool_use",
      id: "toolu_02",
      name: "lookup_guide_entry",
      input: { topic: 42 },
    },
    { type: "thinking", thinking: "the answer is probably 42" },
    { type: "tool_use", id: "toolu_03", name: "destroy_universe", input: {} },
  ],
};

const reply = parseReply(fakeReply);
console.log(
  `stop_reason: ${reply.stop_reason}; kept ${reply.content.length}/5 blocks (thinking dropped)\n`,
);

for (const block of reply.content) {
  if (block.type === "tool_use") {
    console.log(`${block.id} ${block.name}(${JSON.stringify(block.input)})`);
    console.log(`  → ${runTool(block.name, block.input).slice(0, 90)}\n`);
  } else {
    console.log(`(text) ${block.text}\n`);
  }
}

console.log(
  "The toolu_02 result above is what you ship back as its tool_result —",
);
console.log(
  "the model sees the validation error and retries with a string. Errors are results.",
);
