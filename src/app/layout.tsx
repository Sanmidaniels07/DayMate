import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import '@/styles/globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const clash = localFont({
  src: '../../public/fonts/ClashDisplay-Variable.woff2',
  variable: '--font-display',
  weight: '400 700',
});

export const metadata: Metadata = {
  title: 'DayMate',
  description: 'Find your birthday people.',
};

export const viewport: Viewport = {
  themeColor: '#b9c4cc',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${clash.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}