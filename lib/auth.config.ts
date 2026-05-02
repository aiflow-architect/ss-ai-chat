import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — ห้าม import mongodb, bcrypt หรือ Node.js-only modules ที่นี่
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  providers: [], // providers จะถูก inject ใน auth.ts (Node.js runtime)
}
