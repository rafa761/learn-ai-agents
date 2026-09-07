// The same agent loop as 0002, now on the official SDK.
// The wire types arrive for free — and tool input still arrives as unknown.
// Live: needs ANTHROPIC_API_KEY (loadEnvFile is Rafael's labs/0002 improvement).

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

process.loadEnvFile(".env"); // must run before the client reads the env
const client = new Anthropic(); // reads ANTHROPIC_API_KEY itself

// ---------- 1. The tool (unchanged from 0002) ----------

const GUIDE_ENTRIES: Record<string, string> = {
  towel:
    "About the most massively useful thing an interstellar hitchhiker can have: warmth, shade, " +
    "a weapon, a sail. Carrying one signals to strags that you know where your towel is.",
  "babel fish":
    "Small, yellow, leech-like, and probably the oddest thing in the Universe. Pop it in your " +
    "ear and understand anything said in any language.",
  "forty two":
    "The Answer to the Great Question of Life, the Universe and Everything. Nobody knows what " +
    "the actual Question is.",
};

const TOOLS: Anthropic.Tool[] = [
  {
    name: "lookup_guide_entry",
    description:
      "Look up an entry from the Hitchhiker's Guide to the Galaxy. Returns the entry text " +
      "for a topic. Topic keys are short, e.g. 'towel', 'babel fish', 'forty two'.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "The Guide topic to look up, e.g. 'towel' or 'babel fish'",
        },
      },
      required: ["topic"],
    },
  },
];

// ---------- 2. The one guard that never retires: args at the boundary ----------

const GuideArgs = z.object({ topic: z.string() });

// ---------- 3. The loop — note what is GONE from labs/0002 ----------

const messages: Anthropic.MessageParam[] = [
  {
    role: "user",
    content:
      "What does the Guide say about towels? And what exactly is a Babel fish?",
  },
];

const MAX_HOPS = 5; // circuit breaker, as ever
let finished = false;

for (let hop = 1; hop <= MAX_HOPS; hop++) {
  const reply = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    tools: TOOLS,
    messages,
  });
  // reply is fully typed: reply.content is a union, reply.stop_reason is a union —
  // no parseReply, no isTextBlock, no isToolUseBlock. The SDK shipped the types.
  messages.push({ role: "assistant", content: reply.content }); // echo verbatim

  if (reply.stop_reason !== "tool_use") {
    for (const block of reply.content) {
      if (block.type === "text") console.log(block.text); // narrowed by .type, not by guards
    }
    console.log(
      `\n— finished after ${hop} hop(s); stop_reason: ${reply.stop_reason}; ` +
        `tokens in ${reply.usage.input_tokens} / out ${reply.usage.output_tokens}`,
    );
    finished = true;
    break;
  }

  console.log(`hop ${hop}: model wants tools`);
  const results: Anthropic.ToolResultBlockParam[] = [];
  for (const block of reply.content) {
    if (block.type !== "tool_use") continue; // discriminated union narrows here
    const args = GuideArgs.safeParse(block.input); // block.input: unknown — STILL, FOREVER
    const content = args.success
      ? (GUIDE_ENTRIES[args.data.topic.trim().toLowerCase()] ??
        `No Guide entry for "${args.data.topic}".`)
      : `error: invalid arguments\n${z.prettifyError(args.error)}`; // error as result — model retries
    results.push({ type: "tool_result", tool_use_id: block.id, content });
    console.log(`  ${block.id} "${content.slice(0, 48)}…"`);
  }
  messages.push({ role: "user", content: results });
}

if (!finished)
  console.warn("Hit the hop cap — the model never stopped calling tools.");
