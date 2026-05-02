// DeepSeek ใช้ OpenAI-compatible API
import OpenAI from 'openai'

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})

export async function streamDeepSeek(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  model: string,
  onChunk: (text: string) => void
): Promise<string> {
  const stream = await deepseek.chat.completions.create({
    model,
    messages,
    stream: true,
  })

  let full = ''
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || ''
    full += text
    onChunk(text)
  }
  return full
}

export default deepseek
