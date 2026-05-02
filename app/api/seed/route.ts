import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

// API นี้ใช้สร้าง user ครั้งแรก - ควรลบออกหลัง setup เสร็จ
// เรียกด้วย POST /api/seed พร้อม body: { username, password, adminKey }
export async function POST(req: NextRequest) {
  const { username, password, adminKey } = await req.json()

  // ป้องกันการเรียกโดยไม่ได้รับอนุญาต
  if (adminKey !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!username || !password) {
    return NextResponse.json({ error: 'กรุณาใส่ username และ password' }, { status: 400 })
  }

  const db = await getDb()

  const existing = await db.collection('users').findOne({ username })
  if (existing) {
    return NextResponse.json({ error: 'Username นี้มีอยู่แล้ว' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  await db.collection('users').insertOne({
    username,
    password: hashed,
    createdAt: new Date(),
  })

  return NextResponse.json({ ok: true, message: `สร้าง user "${username}" สำเร็จ` })
}
