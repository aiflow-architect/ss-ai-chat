import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function streamGemini(
  messages: { role: 'user' | 'assistant'; content: string }[],
  model: string,
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<string> {
  const geminiModel = genAI.getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
  })

  // แปลง messages เป็น format ของ Gemini
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1]

  const chat = geminiModel.startChat({ history })
  const result = await chat.sendMessageStream(lastMessage.content)

  let full = ''
  for await (const chunk of result.stream) {
    const text = chunk.text()
    full += text
    onChunk(text)
  }

  return full
}

export default genAI
