import './globals.css'
import { Inter } from 'next/font/google'
import ThemeProvider from './ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Dev Collaboration App',
  description: 'Real-time collaborative development environment',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
