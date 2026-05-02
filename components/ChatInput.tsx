'use client'

import { useState, useRef, useEffect } from 'react'
import type { Mode } from '@/lib/types'

interface AttachedFile {
  type: 'image' | 'document'
  name: string
  base64: string
  mimeType: string
}

interface Props {
  onSend: (text: string, attachedFile?: AttachedFile) => void
  loading: boolean
  mode: Mode
}

export default function ChatInput({ onSend, loading, mode }: Props) {
  const [text, setText] = useState('')
  const [attached, setAttached] = useState<AttachedFile | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const placeholder =
    mode === 'artwork'
      ? 'อธิบายภาพที่ต้องการ เช่น "แมวนั่งบนหลังคาตอนพระอาทิตย์ตก"'
      : mode === 'marketing'
      ? 'บอกสิ่งที่ต้องการ เช่น "เขียน broadcast โปรโมชั่นลด 20%"'
      : mode === 'code'
      ? 'ถามเรื่องโค้ด เช่น "เขียน function คำนวณ VAT ด้วย Python"'
      : 'พิมพ์ข้อความ หรือแนบรูป/ไฟล์...'

  // Auto resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [text])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((!text.trim() && !attached) || loading) return
    onSend(text.trim(), attached || undefined)
    setText('')
    setAttached(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // รับไฟล์จาก input
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
    e.target.value = ''
  }

  // แปลงไฟล์เป็น base64
  async function processFile(file: File) {
    const isImage = file.type.startsWith('image/')
    const isDoc = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'].includes(file.type)

    if (!isImage && !isDoc) {
      alert('รองรับเฉพาะ รูปภาพ, PDF, Word, TXT, CSV ครับ')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setAttached({
        type: isImage ? 'image' : 'document',
        name: file.name,
        base64,
        mimeType: file.type,
      })
    }
    reader.readAsDataURL(file)
  }

  // Paste รูปจาก clipboard
  async function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) await processFile(file)
        break
      }
    }
  }

  return (
    <div className="space-y-2">
      {/* Preview ไฟล์ที่แนบ */}
      {attached && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
          <span className="text-lg">{attached.type === 'image' ? '🖼️' : '📄'}</span>
          <span className="text-sm text-blue-700 flex-1 truncate">{attached.name}</span>
          <button
            onClick={() => setAttached(null)}
            className="text-blue-400 hover:text-red-500 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        {/* ปุ่มแนบไฟล์ (ทุกโหมด — artwork รับเฉพาะรูป) */}
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={mode === 'artwork' ? 'image/*' : 'image/*,.pdf,.doc,.docx,.txt,.csv'}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex-shrink-0 w-12 h-[58px] border border-gray-300 rounded-2xl flex items-center justify-center text-xl text-gray-500 hover:bg-gray-100 hover:border-blue-400 transition-colors disabled:opacity-40"
            title={mode === 'artwork' ? 'แนบรูปอ้างอิงสไตล์' : 'แนบรูปหรือไฟล์'}
          >
            📎
          </button>
        </>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={loading}
          rows={1}
          className="flex-1 border border-gray-300 rounded-2xl px-5 py-4 text-[17px] leading-relaxed resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={loading || (!text.trim() && !attached)}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl px-6 py-4 text-[17px] font-semibold transition-colors flex-shrink-0 h-[58px]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </span>
          ) : (
            '➤'
          )}
        </button>
      </form>
      <p className="text-xs text-gray-400 text-center">
        Enter = ส่ง &nbsp;|&nbsp; Shift+Enter = ขึ้นบรรทัดใหม่ &nbsp;|&nbsp; 📎 = แนบรูป/ไฟล์ &nbsp;|&nbsp; Ctrl+V = วางรูป
      </p>
    </div>
  )
}
