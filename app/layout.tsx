import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vila de Fenals',
  description: 'Acceso Domótico',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
