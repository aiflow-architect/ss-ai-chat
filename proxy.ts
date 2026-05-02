import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isLoginPage = pathname === '/login'
  const isApiAuth = pathname.startsWith('/api/auth')
  const isApiSeed = pathname.startsWith('/api/seed')
  const isStatic = pathname.startsWith('/_next') || pathname === '/favicon.ico'

  if (isStatic || isApiAuth || isApiSeed) return NextResponse.next()

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
