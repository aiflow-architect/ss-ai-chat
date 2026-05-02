import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { Conversation } from '@/lib/types'

// GET - ดึงรายการ conversations ของ user
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const conversations = await db
    .collection('conversations')
    .find({ userId: session.user?.id })
    .sort({ updatedAt: -1 })
    .project({ messages: 0 }) // ไม่ดึง messages มาทั้งหมด เพื่อความเร็ว
    .toArray()

  return NextResponse.json(conversations)
}

// POST - สร้าง conversation ใหม่
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, mode, model, folderId } = await req.json()
  const db = await getDb()

  const newConv: Omit<Conversation, '_id'> = {
    userId: session.user?.id as string,
    folderId: folderId || null,
    title: title || 'แชทใหม่',
    mode,
    model,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await db.collection('conversations').insertOne(newConv)
  return NextResponse.json({ _id: result.insertedId, ...newConv })
}

// PATCH - อัปเดต conversation (เพิ่ม messages, เปลี่ยนชื่อ)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, messages, title, folderId } = await req.json()
  const db = await getDb()

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (messages !== undefined) update.messages = messages
  if (title !== undefined) update.title = title
  if (folderId !== undefined) update.folderId = folderId

  await db.collection('conversations').updateOne(
    { _id: new ObjectId(id), userId: session.user?.id },
    { $set: update }
  )

  return NextResponse.json({ ok: true })
}

// DELETE - ลบ conversation
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const db = await getDb()

  await db.collection('conversations').deleteOne({
    _id: new ObjectId(id),
    userId: session.user?.id,
  })

  return NextResponse.json({ ok: true })
}
