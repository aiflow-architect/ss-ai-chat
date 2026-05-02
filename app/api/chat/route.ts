import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { MODE_SYSTEM_PROMPTS } from '@/lib/types'
import type { Mode } from '@/lib/types'

export const runtime = 'nodejs'

interface AttachedFile {
  type: 'image' | 'document'
  // รูป: ใช้ url (Cloudinary) — ไม่ส่ง base64 ผ่าน Vercel อีกต่อไป
  url?: string
  // เอกสาร: ใช้ base64
  base64?: string
  mimeType: string
  name: string
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: string | any[]
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages, model, mode, attachedFile } = await req.json() as {
    messages: { role: string; content: string }[]
    model: string
    mode: string
    attachedFile?: AttachedFile
  }

  const systemPrompt = MODE_SYSTEM_PROMPTS[mode as Mode]
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const onChunk = (text: string) => {
          controller.enqueue(encoder.encode(text))
        }

        const provider = getProvider(model)

        if (provider === 'anthropic') {
          const { streamClaude } = await import('@/lib/ai/claude')
          const claudeMessages = buildClaudeMessages(messages, attachedFile)
          await streamClaude(claudeMessages, model, systemPrompt, onChunk)
        } else if (provider === 'google') {
          const { streamGemini } = await import('@/lib/ai/gemini')
          const geminiMessages = buildTextMessages(messages, attachedFile)
          await streamGemini(geminiMessages, model, systemPrompt, onChunk)
        } else if (provider === 'deepseek') {
          const { streamDeepSeek } = await import('@/lib/ai/deepseek')
          const withSystem: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...buildOpenAIMessages(messages, attachedFile),
          ]
          await streamDeepSeek(withSystem as { role: 'user' | 'assistant' | 'system'; content: string }[], model, onChunk)
        } else {
          const { streamOpenAI } = await import('@/lib/ai/openai')
          const withSystem: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...buildOpenAIMessages(messages, attachedFile),
          ]
          await streamOpenAI(withSystem, model, onChunk)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
        controller.enqueue(encoder.encode(`\n\n❌ ${msg}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}

function getProvider(model: string): string {
  if (model.startsWith('claude')) return 'anthropic'
  if (model.startsWith('gemini')) return 'google'
  if (model.startsWith('deepseek')) return 'deepseek'
  return 'openai'
}

// OpenAI Vision format — ใช้ image_url จาก Cloudinary URL โดยตรง
function buildOpenAIMessages(
  messages: { role: string; content: string }[],
  attachedFile?: AttachedFile
): ChatMessage[] {
  if (!attachedFile) {
    return messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  }

  const lastMsg = messages[messages.length - 1]
  const rest = messages.slice(0, -1).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  if (attachedFile.type === 'image' && attachedFile.url) {
    return [
      ...rest,
      {
        role: lastMsg.role as 'user',
        content: [
          { type: 'text', text: lastMsg.content || 'วิเคราะห์ภาพนี้ให้หน่อยครับ' },
          {
            type: 'image_url',
            image_url: { url: attachedFile.url },
          },
        ],
      },
    ]
  } else if (attachedFile.type === 'document' && attachedFile.base64) {
    const docText = Buffer.from(attachedFile.base64, 'base64').toString('utf-8').slice(0, 8000)
    return [
      ...rest,
      {
        role: lastMsg.role as 'user',
        content: `${lastMsg.content || 'สรุปเอกสารนี้ให้หน่อยครับ'}\n\n[ไฟล์: ${attachedFile.name}]\n${docText}`,
      },
    ]
  }

  return messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
}

// Claude Vision format — ใช้ URL แทน base64
function buildClaudeMessages(
  messages: { role: string; content: string }[],
  attachedFile?: AttachedFile
): { role: 'user' | 'assistant'; content: string | object[] }[] {
  if (!attachedFile) {
    return messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  }

  const lastMsg = messages[messages.length - 1]
  const rest = messages.slice(0, -1).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  if (attachedFile.type === 'image' && attachedFile.url) {
    return [
      ...rest,
      {
        role: 'user' as const,
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: attachedFile.url,
            },
          },
          { type: 'text', text: lastMsg.content || 'วิเคราะห์ภาพนี้ให้หน่อยครับ' },
        ],
      },
    ]
  } else if (attachedFile.type === 'document' && attachedFile.base64) {
    const docText = Buffer.from(attachedFile.base64, 'base64').toString('utf-8').slice(0, 8000)
    return [
      ...rest,
      {
        role: 'user' as const,
        content: `${lastMsg.content || 'สรุปเอกสารนี้ให้หน่อยครับ'}\n\n[ไฟล์: ${attachedFile.name}]\n${docText}`,
      },
    ]
  }

  return messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
}

// Gemini — ใช้ URL แทน base64
function buildTextMessages(
  messages: { role: string; content: string }[],
  attachedFile?: AttachedFile
): { role: 'user' | 'assistant'; content: string }[] {
  if (!attachedFile) {
    return messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
  }

  const lastMsg = messages[messages.length - 1]
  const rest = messages.slice(0, -1).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  if (attachedFile.type === 'image' && attachedFile.url) {
    return [
      ...rest,
      {
        role: 'user' as const,
        content: `[แนบรูปภาพ: ${attachedFile.url}]\n${lastMsg.content || 'วิเคราะห์ภาพนี้ให้หน่อยครับ'}`,
      },
    ]
  } else if (attachedFile.type === 'document' && attachedFile.base64) {
    const docText = Buffer.from(attachedFile.base64, 'base64').toString('utf-8').slice(0, 8000)
    return [
      ...rest,
      {
        role: 'user' as const,
        content: `${lastMsg.content || 'สรุปเอกสารนี้ให้หน่อยครับ'}\n\n[ไฟล์: ${attachedFile.name}]\n${docText}`,
      },
    ]
  }

  return messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
}
