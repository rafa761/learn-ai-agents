process.loadEnvFile(".env")
const key = process.env.ANTHROPIC_API_KEY;
if (!key) throw new Error("set ANTHROPIC_API_KEY");

const res = await fetch(
    "https://api.anthropic.com/v1/messages",
    {
        method: "POST",
        headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: 64,
            messages: [{
                role: "user",
                content: "Reply with exactly: agent channel open"
            }],
        }),
    }
);

const data: unknown = await res.json();
console.log(data)


/*
Response example:

~/repositories/ai-certification/learn-ai-agents learning/ai-agents-ts*
❯ npx tsx labs/0001-agent-types/stretch.mts
npm notice run learn-ai-agents@1.0.0 npx
npm notice run 'tsx' labs/0001-agent-types/stretch.mts
{
  model: 'claude-haiku-4-5-20251001',
  id: 'msg_011Ceoy1uq5DGSrQ97YAfqLp',
  type: 'message',
  role: 'assistant',
  content: [ { type: 'text', text: 'agent channel open' } ],
  stop_reason: 'end_turn',
  stop_sequence: null,
  stop_details: null,
  usage: {
    input_tokens: 14,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
    output_tokens: 6,
    service_tier: 'standard',
    inference_geo: 'not_available'
  }
}

*/