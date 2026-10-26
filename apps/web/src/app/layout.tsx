import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import Providers from '@/components/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Muskai · Write the prompt. Get the reel.',
    template: '%s · Muskai',
  },
  description:
    'Muskai turns a sentence into a finished vertical reel. Write a prompt, pick a shape, and let the engine chain render it. Publish to the community feed when it is ready.',
  openGraph: {
    title: 'Muskai · Write the prompt. Get the reel.',
    description:
      'A prompt becomes a finished reel. Made for creators, rendered with the Wan model family.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="min-h-[100dvh] bg-white font-sans text-ink-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
