'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Tab "Xu hướng" ẩn cho đến khi đủ MIN_TREND_WEEKS tuần dữ liệu thật (trang /trends vẫn còn, chỉ báo ngày có)
const TABS = [
  { href: '/overview', label: 'Tổng quan' },
  { href: '/companies', label: 'Công ty' },
];

export function TopNav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <div className="navi">
        <b>Hiring intelligence</b>
        <div className="tabs">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={path.startsWith(t.href) ? 'on' : ''}>{t.label}</Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
