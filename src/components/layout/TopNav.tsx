'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/overview', label: 'Tổng quan' },
  { href: '/trends', label: 'Xu hướng' },
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
