import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sigma Nu — Stanford',
  description: 'Chapter management platform for Sigma Nu at Stanford University',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
