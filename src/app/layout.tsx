import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Be_Vietnam_Pro } from 'next/font/google';
import { FilterProvider } from '@/context/FilterContext';
import { TopNav } from '@/components/layout/TopNav';
import './globals.css';

// Font tự host lúc build (next/font): không gọi Google Fonts khi chạy, không chặn render, không nhảy layout.
const font = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-vn',
});

export const metadata: Metadata = { title: 'Hiring intelligence', description: 'Thị trường tuyển dụng đa ngành và hồ sơ công ty' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={font.variable}>
      <body>
        <FilterProvider>
          <TopNav />
          {children}
        </FilterProvider>
      </body>
    </html>
  );
}
