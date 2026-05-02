import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { generateImage } from '@/lib/ai/openai'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { prompt } = await req.json()
  if (!prompt) {
    return NextResponse.json({ error: 'กรุณาใส่คำอธิบายภาพ' }, { status: 400 })
  }

  try {
    const imageUrl = await generateImage(prompt)
    return NextResponse.json({ imageUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
