import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MessageContent = string | any[]

export async function streamOpenAI(
  messages: { role: 'user' | 'assistant' | 'system'; content: MessageContent }[],
  model: string,
  onChunk: (text: string) => void
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stream = await openai.chat.completions.create({
    model,
    messages: messages as any,
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

export async function generateImage(prompt: string): Promise<string> {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  })
  if (!response.data || !response.data[0]?.url) {
    throw new Error('ไม่สามารถสร้างภาพได้ กรุณาลองใหม่')
  }
  return response.data[0].url
}

export default openai
