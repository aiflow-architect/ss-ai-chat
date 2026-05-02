import { handlers } from '@/lib/auth'

// Force dynamic to prevent Turbopack from statically evaluating this route
// next-auth v5 + Next.js 16 Turbopack compatibility fix
export const dynamic = 'force-dynamic'

export const { GET, POST } = handlers
