// The agent loop, live: Claude + one tool + an append-only ledger.
process.loadEnvFile(".env"); // Load our env file

// ---------- 1. The tool: a tiny Guide corpus (the seed of RAG) ----------

const GUIDE_ENTRIES: Record<string, string> = {
  towel:
    "About the most massively useful thing an interstellar hitchhiker can have: warmth, shade, " +
    "a weapon, a sail. Carrying one signals to strags that you know where your towel is.",
  "babel fish":
    "Small, yellow, leech-like, and probably the oddest thing in the Universe. Pop it in your " +
    "ear and understand anything said in any language. Famously disproved the existence of God by accident.",
  "pan galactic gargle blaster":
    "The best drink in existence. The effect is like having your brains smashed out by a slice " +
    "of lemon wrapped round a large gold brick. Never more than two.",
  "forty two":
    "The Answer to the Great Question of Life, the Universe and Everything, computed over 7.5 " +
    "million years. Nobody knows what the actual Question is.",
  improbability:
    "Crosses interstellar distances without all that tedious mucking about in hyperspace, by " +
    "passing through every point in the Universe simultaneously.",
  "vogon poetry": "The third worst in the universe",
};

function lookupGuideEntry(topic: string): string {
  const key = topic.trim().toLowerCase();
  return (
    GUIDE_ENTRIES[key] ??
    `No Guide entry for "${topic}" - the researchers are out to lunch.`
  );
}

// The tool as the MODEL sees it: a name, a description (this is a prompt!),
// and a JSON Schema for the arguments. No TypeScript crosses this boundary.
const TOOLS = [
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

// ---------- 2. Narrow the response — lesson 0001's discipline, on real model output ----------
interface TextBlock {
  type: "text";
  text: string;
}
interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}
type ContentBlock = TextBlock | ToolUseBlock;

interface ModelReply {
  stop_reason: string;
  content: ContentBlock[];
}

function isTextBlock(b: unknown): b is TextBlock {
  return (
    typeof b === "object" &&
    b !== null &&
    "type" in b &&
    b.type === "text" &&
    "text" in b &&
    typeof b.text === "string"
  );
}

function isToolUseBlock(b: unknown): b is ToolUseBlock {
  return (
    typeof b === "object" &&
    b !== null &&
    "type" in b &&
    b.type === "tool_use" &&
    "id" in b &&
    typeof b.id === "string" &&
    "name" in b &&
    typeof b.name === "string" &&
    "input" in b &&
    typeof b.input === "object" &&
    b.input !== null
  );
}

function parseReply(raw: unknown): ModelReply {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("response: not an object");
  }

  if (!("stop_reason" in raw) || typeof raw.stop_reason !== "string") {
    throw new Error("response: stop_reason missing or not a string");
  }

  if (!("content" in raw) || !Array.isArray(raw.content)) {
    throw new Error("response: content missing or not an array");
  }

  const blocks = raw.content.filter(
    (b): b is ContentBlock => isTextBlock(b) || isToolUseBlock(b),
  );

  // Blocks we don't model yet (e.g. 'thinking') are dropped, not trusted.
  return {
    stop_reason: raw.stop_reason,
    content: blocks,
  };
}

// ---------- 3. The ledger: messages in real wire format ----------
interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
}

type LedgerMessage =
  | { role: "user"; content: string } // our questions
  | { role: "assistant"; content: ContentBlock[] } // echoed back VERBATIM
  | { role: "user"; content: ToolResultBlock[] }; // tool results ride as user blocks

// ---------- 4. Transport: one HTTP call per hop ----------
async function callClaude(messages: LedgerMessage[]): Promise<ModelReply> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      tools: TOOLS,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }

  const raw: unknown = await res.json(); // park it: res.json() is typed any
  return parseReply(raw); // unknown in, typed out — or it throws
}

// ---------- 5. Dispatch: model JSON -> typed tool result ----------
function runTool(block: ToolUseBlock): ToolResultBlock {
  switch (block.name) {
    case "lookup_guide_entry": {
      const topic = block.input.topic; // unknown — the model sent this
      if (typeof topic !== "string") {
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: "error: topic must be a string",
        };
      }
      return {
        type: "tool_result",
        tool_use_id: block.id,
        content: lookupGuideEntry(topic),
      };
    }
    default:
      // Open world: tool names come from a model and can be anything.
      // The default arm is not dead code — it IS the error handling.
      return {
        type: "tool_result",
        tool_use_id: block.id,
        content: `error: unknown tool "${block.name}"`,
      };
  }
}

// ---------- 6. The loop ----------
const messages: LedgerMessage[] = [
  {
    role: "user",
    content:
      "What does the Guide say about towels? And what exactly is a Babel fish",
  },
];

const MAX_HOPS = 5; // circuit breaker — the book's canonical loop ships with one
let finished = false;

for (let hop = 1; hop <= MAX_HOPS; hop++) {
  const reply = await callClaude(messages);
  messages.push({ role: "assistant", content: reply.content }); // echo verbatim

  if (reply.stop_reason !== "tool_use") {
    for (const block of reply.content) {
      if (block.type === "text") console.log(block.text);
    }
    console.log(
      `\n— finished after ${hop} hop(s); stop_reason: ${reply.stop_reason}`,
    );
    finished = true;
    break;
  }

  const calls = reply.content.filter(
    (b): b is ToolUseBlock => b.type === "tool_use",
  );
  console.log(`hop ${hop}: model calls ${calls.length} tool(s)`);
  const results = calls.map(runTool);
  for (const r of results) {
    console.log(
      `  toolu_${r.tool_use_id.slice(-6)} "${r.content.slice(0, 48)}…"`,
    );
  }

  messages.push({ role: "user", content: results });
}

if (!finished)
  console.warn("Hit the hop cap — the model never stopped calling tools.");
