import './globals.css';
import SW from '@/components/SW';
import type { Metadata, Viewport } from 'next';
export const metadata: Metadata = { title: 'GranaClara', description: 'Controle financeiro', manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' }, appleWebApp: { capable: true, title: 'GranaClara', statusBarStyle: 'default' } };
export const viewport: Viewport = { themeColor: '#0d9488', width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function L({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body>{children}<SW /></body></html>;
}
