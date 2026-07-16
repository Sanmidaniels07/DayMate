import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { fraunces, jetbrainsMono, jakarta } from '@/lib/fonts';
import { Providers } from './providers';

export const metadata: Metadata = { title: 'DayMate', description: 'Find your birthday people.' };
export const viewport: Viewport = { themeColor: '#b9c4cc', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${jetbrainsMono.variable} ${jakarta.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}