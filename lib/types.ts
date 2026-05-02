import { ObjectId } from 'mongodb'

export type Mode = 'chat' | 'marketing' | 'artwork' | 'code'

export type AIModel =
  | 'gpt-4o'
  | 'gpt-4'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-haiku-20240307'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'deepseek-chat'
  | 'deepseek-coder'
  | 'dall-e-3'

export interface ModelOption {
  id: AIModel
  label: string
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek'
}

export const MODE_MODELS: Record<Mode, ModelOption[]> = {
  chat: [
    { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4', label: 'GPT-4', provider: 'openai' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'google' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'google' },
    { id: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'deepseek' },
  ],
  marketing: [
    { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4', label: 'GPT-4', provider: 'openai' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'google' },
    { id: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'deepseek' },
  ],
  artwork: [
    { id: 'dall-e-3', label: 'DALL-E 3', provider: 'openai' },
  ],
  code: [
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', provider: 'anthropic' },
    { id: 'deepseek-coder', label: 'DeepSeek Coder', provider: 'deepseek' },
  ],
}

export const MODE_LABELS: Record<Mode, string> = {
  chat: '💬 Chat',
  marketing: '📣 การตลาด',
  artwork: '🎨 Artwork',
  code: '💻 Code',
}

export const MODE_SYSTEM_PROMPTS: Record<Mode, string> = {
  chat: 'คุณเป็นผู้ช่วย AI ที่เป็นมิตร ตอบภาษาไทยได้ ช่วยตอบคำถามทั่วไปได้ดี',
  marketing: 'คุณเป็นผู้เชี่ยวชาญด้านการตลาดและ copywriting ภาษาไทย ช่วยเขียน broadcast, โฆษณา, caption, และเนื้อหาการตลาดที่น่าสนใจ กระชับ และได้ผล',
  artwork: 'คุณช่วยสร้างภาพด้วย DALL-E 3 รับคำอธิบายภาษาไทยแล้วแปลงเป็น prompt ภาษาอังกฤษที่ดีที่สุด',
  code: 'คุณเป็น senior developer ช่วยเขียนโค้ด debug และอธิบายโค้ดได้ทุกภาษา ตอบทั้งภาษาไทยและอังกฤษได้',
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  createdAt: Date
}

export interface Conversation {
  _id?: ObjectId
  userId: string
  folderId?: string | null
  title: string
  mode: Mode
  model: AIModel
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface Folder {
  _id?: ObjectId
  userId: string
  name: string
  createdAt: Date
}

export interface User {
  _id?: ObjectId
  username: string
  password: string
  createdAt: Date
}
