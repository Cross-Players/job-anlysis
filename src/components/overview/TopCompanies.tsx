// Cầu nối sang trang Công ty: các công ty đang mở nhiều tin nhất với bộ lọc hiện tại.
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { OverviewData } from '@/lib/market';

export function TopCompanies({ d }: { d: OverviewData }) {
  return (
    <Card
      className="mb"
      title="Công ty tuyển nhiều nhất"
      subtitle="Số tin đang mở khớp bộ lọc"
      action={<Link href="/companies" className="sel" style={{ textDecoration: 'none' }}>Xem tất cả công ty</Link>}
    >
      {d.topCompanies.map((c) => (
        <Link key={c.id} href={`/companies/profile?id=${encodeURIComponent(c.id)}`} className="hot two">
          <b>{c.name}</b>
          <span className="mini">{c.n} tin đang mở</span>
        </Link>
      ))}
      {!d.topCompanies.length && <p className="mini">Không có công ty nào khớp bộ lọc đang chọn.</p>}
    </Card>
  );
}
