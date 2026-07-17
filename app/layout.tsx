import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BP Tracker | Blood Pressure Dashboard',
  description: 'Track and monitor your blood pressure readings with a modern, intuitive dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-bg-primary text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  )
}
