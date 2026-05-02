'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '@/lib/types'

interface Props {
  message: Message
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl flex-shrink-0 mt-1">
          🤖
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[75%] group relative ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-5 py-4 text-[17px] leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}
        >
          {/* Image (user แนบ หรือ AI สร้าง) */}
          {message.imageUrl && (
            <div className="mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl}
                alt="Image"
                className="rounded-xl max-w-full max-h-80 object-contain"
              />
              {/* ปุ่ม download เฉพาะรูปจาก AI (URL จาก OpenAI หรือ data:) */}
              {(message.imageUrl.startsWith('https://') || message.imageUrl.startsWith('data:')) && message.role === 'assistant' && (
                <a
                  href={message.imageUrl}
                  download="image.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-blue-300 underline"
                >
                  ⬇️ ดาวน์โหลดภาพ
                </a>
              )}
            </div>
          )}

          {/* Text content */}
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-base max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Copy button - แสดงเมื่อ hover */}
        {!isUser && message.content && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-7 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            {copied ? '✅ คัดลอกแล้ว' : '📋 คัดลอก'}
          </button>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl flex-shrink-0 mt-1">
          👤
        </div>
      )}
    </div>
  )
}
