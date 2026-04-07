import type { Metadata } from 'next';
import './globals.css'; // Global styles
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: {
    template: '%s | ARTWALK',
    default: 'ARTWALK',
  },
  description: '探索全球艺术展览 | Discover global art exhibitions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
