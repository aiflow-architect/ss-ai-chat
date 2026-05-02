import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClaudeMessage = { role: 'user' | 'assistant'; content: string | any[] }

export async function streamClaude(
  messages: ClaudeMessage[],
  model: string,
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  let full = ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = anthropic.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages as any,
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      full += chunk.delta.text
      onChunk(chunk.delta.text)
    }
  }

  return full
}

export default anthropic
