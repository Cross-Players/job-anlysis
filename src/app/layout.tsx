import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { FilterProvider } from '@/context/FilterContext';
import { TopNav } from '@/components/layout/TopNav';
import './globals.css';

export const metadata: Metadata = { title: 'Hiring intelligence', description: 'Thị trường tuyển dụng đa ngành và hồ sơ công ty' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" />
      </head>
      <body>
        <FilterProvider>
          <TopNav />
          {children}
        </FilterProvider>
      </body>
    </html>
  );
}
