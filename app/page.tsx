'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from '@/components/Sidebar'
import ModeSelector from '@/components/ModeSelector'
import ModelSelector from '@/components/ModelSelector'
import ChatMessage from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'
import { MODE_MODELS } from '@/lib/types'
import type { Mode, AIModel, Message, Conversation } from '@/lib/types'

interface AttachedFile {
  type: 'image' | 'document'
  name: string
  base64: string
  mimeType: string
}

export default function HomePage() {
  const { data: session } = useSession()

  const [mode, setMode] = useState<Mode>('chat')
  const [model, setModel] = useState<AIModel>('gpt-4o')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [sidebarKey, setSidebarKey] = useState(0)

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const firstModel = MODE_MODELS[mode][0]?.id
    if (firstModel) setModel(firstModel)
  }, [mode])

  async function loadConversation(id: string) {
    const res = await fetch(`/api/conversations/${id}`)
    const conv: Conversation = await res.json()
    setActiveConvId(id)
    setMode(conv.mode)
    setModel(conv.model)
    setMessages(conv.messages)
  }

  function startNew() {
    setActiveConvId(null)
    setMessages([])
    setMode('chat')
    setModel('gpt-4o')
  }

  const saveConversation = useCallback(
    async (convId: string | null, newMessages: Message[], title?: string) => {
      if (convId) {
        await fetch('/api/conversations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: convId, messages: newMessages, title }),
        })
        return convId
      } else {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, model, title: title || 'แชทใหม่' }),
        })
        const conv = await res.json()
        setActiveConvId(conv._id)
        setSidebarKey((k) => k + 1)
        return conv._id as string
      }
    },
    [mode, model]
  )

  async function handleSend(text: string, attachedFile?: AttachedFile) {
    if (loading) return

    // สร้าง user message พร้อม preview รูป (ถ้ามี)
    const userMsg: Message = {
      role: 'user',
      content: text || (attachedFile?.type === 'image' ? '🖼️ [แนบรูปภาพ]' : `📄 [${attachedFile?.name}]`),
      imageUrl: attachedFile?.type === 'image'
        ? `data:${attachedFile.mimeType};base64,${attachedFile.base64}`
        : undefined,
      createdAt: new Date(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    // Artwork mode → เรียก image API
    if (mode === 'artwork') {
      try {
        // ถ้ามีรูปอ้างอิง → ให้ GPT-4o วิเคราะห์สไตล์ก่อน แล้วสร้าง enhanced prompt
        let finalPrompt = text
        if (attachedFile?.type === 'image') {
          const visionRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'วิเคราะห์สไตล์ของภาพนี้ แล้วสร้าง DALL-E prompt ภาษาอังกฤษที่จะสร้างภาพในสไตล์เดียวกัน โดยเนื้อหาของภาพคือ: ' + (text || 'สร้างภาพในสไตล์เดียวกัน') }],
              model: 'gpt-4o',
              mode: 'artwork',
              attachedFile,
            }),
          })
          if (visionRes.body) {
            const reader = visionRes.body.getReader()
            const decoder = new TextDecoder()
            let visionText = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              visionText += decoder.decode(value)
            }
            finalPrompt = visionText.trim() || text
          }
        }

        const res = await fetch('/api/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: finalPrompt }),
        })
        const data = await res.json()

        const aiMsg: Message = {
          role: 'assistant',
          content: data.error ? `❌ ${data.error}` : 'นี่คือภาพที่สร้างให้ครับ 🎨',
          imageUrl: data.imageUrl,
          createdAt: new Date(),
        }

        const finalMessages = [...newMessages, aiMsg]
        setMessages(finalMessages)

        const title = text.slice(0, 40)
        const convId = await saveConversation(activeConvId, finalMessages, title)
        if (!activeConvId) setActiveConvId(convId)
        setSidebarKey((k) => k + 1)
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่', createdAt: new Date() },
        ])
      } finally {
        setLoading(false)
      }
      return
    }

    // Text/Vision chat → streaming
    const aiMsg: Message = { role: 'assistant', content: '', createdAt: new Date() }
    setMessages([...newMessages, aiMsg])

    try {
      // ส่ง messages ไป API (ไม่รวม base64 ของ messages เก่า เพื่อประหยัด bandwidth)
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          mode,
          attachedFile: attachedFile || null,
        }),
      })

      if (!res.body) throw new Error('No stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullText += chunk
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...aiMsg, content: fullText }
          return updated
        })
      }

      const finalMessages = [
        ...newMessages,
        { ...aiMsg, content: fullText },
      ]

      const title = (text || attachedFile?.name || 'แชทใหม่').slice(0, 40)
      const convId = await saveConversation(activeConvId, finalMessages, title)
      if (!activeConvId) setActiveConvId(convId)
      setSidebarKey((k) => k + 1)
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...aiMsg,
          content: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่',
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar
        key={sidebarKey}
        activeId={activeConvId}
        onSelect={loadConversation}
        onNew={startNew}
        username={session?.user?.name || 'User'}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap bg-white">
          <ModeSelector mode={mode} onChange={setMode} />
          <ModelSelector mode={mode} model={model} onChange={setModel} />
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">สวัสดีครับ!</h2>
              <p className="text-gray-400 text-lg">
                เลือกโหมดและ AI แล้วเริ่มพิมพ์ได้เลย
              </p>
              <p className="text-gray-300 text-base mt-1">
                📎 แนบรูปหรือไฟล์ได้ &nbsp;|&nbsp; Ctrl+V วางรูปจาก clipboard
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {/* Loading dots */}
          {loading && messages[messages.length - 1]?.role === 'assistant' &&
            messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                🤖
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-5 py-4">
                <div className="flex gap-1.5 items-center h-6">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 px-6 py-4 bg-white">
          <ChatInput onSend={handleSend} loading={loading} mode={mode} />
        </div>
      </div>
    </div>
  )
}
