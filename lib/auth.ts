import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { getDb } from './mongodb'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const db = await getDb()
        const user = await db.collection('users').findOne({
          username: credentials.username,
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password as string
        )

        if (!isValid) return null

        return {
          id: user._id.toString(),
          name: user.username as string,
          email: user.username as string,
        }
      },
    }),
  ],
})
