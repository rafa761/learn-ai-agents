// The shape every agent speaks - and the pattern all agents TS rests on


type Role = "user" | "assistant"

interface TextMessage {
    role: Role;
    kind: "text";
    text: string;
}

interface ToolCallMessage {
    role: "assistant";
    kind: "tool_call";
    tool: string;
    args: Record<string, unknown>;
}

interface ToolResultMessage {
    role: "assistant";
    kind: "tool_result";
    tool: string;
}

type AgentMessage = TextMessage | ToolCallMessage | ToolResultMessage;

function describe(msg: AgentMessage): string {
    switch (msg.kind) {
        case "text":
            return `${msg.role} says: ${msg.text}`;
        case "tool_call":
            return `${msg.role} calls ${msg.tool}(${JSON.stringify(msg.args)})`;
        case "tool_result":
            return `${msg.role} returns ${msg.tool}`;
    }
}

const conversation: AgentMessage[] = [
    {role: "user", kind: "text", text: "What's in chapter 16 of the guide?"},
    {role: "assistant", kind: "tool_call", tool: "search_docs", args: {query: "chapter 16 RAG"}},
    {role: "assistant", kind: "tool_result", tool: "search_docs"}
];


for (const msg of conversation) {
    console.log(describe(msg));
}

