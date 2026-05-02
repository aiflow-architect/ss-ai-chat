# SS AI Chat

ระบบ AI Chat สำหรับทีมงาน — รองรับ GPT-4o, Claude, Gemini, DeepSeek และ DALL-E 3

---

## 🚀 วิธีตั้งค่าและรัน

### 1. แก้ไข `.env.local`

เปิดไฟล์ `.env.local` แล้วแก้ค่าทั้งหมด:

```env
# MongoDB Atlas — ใช้ cluster เดิมได้ แค่เปลี่ยนชื่อ database เป็น ss-ai-chat
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.XXXXX.mongodb.net/ss-ai-chat?retryWrites=true&w=majority

# สร้าง secret แบบสุ่ม เช่น รัน: openssl rand -base64 32
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...
```

### 2. สร้าง User แรก

หลังจากแก้ `.env.local` แล้ว รัน dev server:

```bash
npm run dev
```

แล้วเรียก API สร้าง user (เปิด terminal ใหม่):

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"รหัสผ่านที่ต้องการ","adminKey":"ค่า NEXTAUTH_SECRET ของคุณ"}'
```

หรือใช้ Postman/Thunder Client ก็ได้ครับ:

- **URL:** `POST http://localhost:3000/api/seed`
- **Body (JSON):**

```json
{
  "username": "admin",
  "password": "รหัสผ่านที่ต้องการ",
  "adminKey": "ค่า NEXTAUTH_SECRET ของคุณ"
}
```

### 3. เข้าใช้งาน

เปิด [http://localhost:3000](http://localhost:3000) แล้ว login ด้วย username/password ที่สร้างไว้

---

## 📁 โครงสร้างโปรเจค

```
ss-ai-chat/
├── app/
│   ├── api/
│   │   ├── auth/         ← NextAuth
│   │   ├── chat/         ← AI text streaming
│   │   ├── image/        ← DALL-E 3
│   │   ├── conversations/ ← CRUD แชท
│   │   ├── folders/      ← CRUD โฟลเดอร์
│   │   └── seed/         ← สร้าง user แรก
│   ├── login/            ← หน้า login
│   └── page.tsx          ← หน้าหลัก
├── components/
│   ├── Sidebar.tsx       ← Folder + Chat history
│   ├── ModeSelector.tsx  ← เลือกโหมด
│   ├── ModelSelector.tsx ← เลือก AI model
│   ├── ChatMessage.tsx   ← แสดงข้อความ
│   ├── ChatInput.tsx     ← กล่องพิมพ์
│   └── SessionWrapper.tsx
├── lib/
│   ├── ai/
│   │   ├── openai.ts     ← OpenAI client
│   │   ├── claude.ts     ← Anthropic client
│   │   ├── gemini.ts     ← Google client
│   │   └── deepseek.ts   ← DeepSeek client
│   ├── auth.ts           ← NextAuth config
│   ├── mongodb.ts        ← MongoDB connection
│   └── types.ts          ← TypeScript types
└── middleware.ts          ← Route protection
```

---

## 🌐 Deploy บน Vercel

1. Push โค้ดขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → Import project
3. ตั้งค่า Environment Variables ทั้งหมดใน Vercel Dashboard
4. Deploy!

**Environment Variables ที่ต้องตั้งบน Vercel:**

- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (เปลี่ยนเป็น URL จริง เช่น `https://ss-ai-chat.vercel.app`)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `DEEPSEEK_API_KEY`

---

## 🎯 โหมดที่มี

| โหมด       | ใช้ทำอะไร             | AI ที่เลือกได้                          |
| ---------- | --------------------- | --------------------------------------- |
| 💬 Chat    | คุยทั่วไป             | GPT-4o, GPT-4, Claude, Gemini, DeepSeek |
| 📣 การตลาด | เขียน Broadcast, Copy | GPT-4o, GPT-4, Claude, Gemini, DeepSeek |
| 🎨 Artwork | สร้างภาพ              | DALL-E 3                                |
| 💻 Code    | เขียนโค้ด, Debug      | Claude, DeepSeek                        |
