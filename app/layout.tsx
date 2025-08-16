import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'BuildMart | My personal business tracker',
  description: 'A personal business tracker to manage your projects, tasks, and finances.',
  generator: 'Abir Sarkar',
  applicationName: 'BuildMart',
  openGraph: {
    title: 'BuildMart',
    description: 'A personal business tracker to manage your projects, tasks, and finances.',
    url: 'https://buildmart.vercel.app/',
    siteName: 'BuildMart',
    images: [
      {
        url: 'https://buildmart.vercel.app/og.png',
        width: 800,
        height: 600,
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
