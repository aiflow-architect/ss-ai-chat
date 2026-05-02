import type { Metadata } from 'next'
import { Sarabun } from 'next/font/google'
import './globals.css'
import SessionWrapper from '@/components/SessionWrapper'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sarabun',
})

export const metadata: Metadata = {
  title: 'SS AI Chat',
  description: 'ระบบ AI Chat สำหรับทีมงาน',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} font-sarabun antialiased`}>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  )
}
