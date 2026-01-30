import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { SettingsInitializer } from '@/components/SettingsInitializer';

export const metadata: Metadata = {
  title: 'Clean Edge Scalper',
  description:
    'Professional forex scalping application with real-time Oanda integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <SettingsInitializer />
        <Navigation />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
