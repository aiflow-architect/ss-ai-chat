import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
import type { Folder } from '@/lib/types'

// GET - ดึง folders ทั้งหมดของ user
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const folders = await db
    .collection('folders')
    .find({ userId: session.user?.id })
    .sort({ createdAt: 1 })
    .toArray()

  return NextResponse.json(folders)
}

// POST - สร้าง folder ใหม่
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  const db = await getDb()

  const newFolder: Omit<Folder, '_id'> = {
    userId: session.user?.id as string,
    name: name || 'โฟลเดอร์ใหม่',
    createdAt: new Date(),
  }

  const result = await db.collection('folders').insertOne(newFolder)
  return NextResponse.json({ _id: result.insertedId, ...newFolder })
}

// PATCH - เปลี่ยนชื่อ folder
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, name } = await req.json()
  const db = await getDb()

  await db.collection('folders').updateOne(
    { _id: new ObjectId(id), userId: session.user?.id },
    { $set: { name } }
  )

  return NextResponse.json({ ok: true })
}

// DELETE - ลบ folder (และย้าย conversations ออกจาก folder)
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const db = await getDb()

  // ย้าย conversations ออกจาก folder ก่อนลบ
  await db.collection('conversations').updateMany(
    { folderId: id, userId: session.user?.id },
    { $set: { folderId: null } }
  )

  await db.collection('folders').deleteOne({
    _id: new ObjectId(id),
    userId: session.user?.id,
  })

  return NextResponse.json({ ok: true })
}
