// Cầu nối sang trang Công ty: 5 công ty có đà tăng tin mới cao nhất trong khung thời gian đang xem.
// Danh sách công ty (đã lọc) được truyền vào từ trang, lấy qua tầng API.
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Delta } from '@/components/ui/Delta';
import type { Company } from '@/lib/types';

interface Props { ind: string; companies: Company[]; weeks: number }

export function HotCompanies({ ind, companies, weeks }: Props) {
  // Demo chỉ có công ty ngành IT
  const hasData = ind === 'all' || ind === 'it';
  const enough = hasData ? companies.filter((c) => c.j >= 6) : [];
  const list = [...enough].sort((a, b) => b.g - a.g).slice(0, 5);

  return (
    <Card
      className="mb"
      title="Công ty tuyển mạnh"
      subtitle={`Đà tăng tin mới cao nhất · ${weeks} tuần gần nhất so với ${weeks} tuần trước`}
      action={<Link href="/companies" className="sel" style={{ textDecoration: 'none' }}>Xem tất cả công ty</Link>}
    >
      {list.map((c) => (
        <Link key={c.id} href={`/companies/${c.id}`} className="hot">
          <b>{c.name}</b>
          <span className="mini">{c.model} · {c.dom}</span>
          <span className="mini">{c.j} tin mới</span>
          <Delta value={c.g} digits={0} />
        </Link>
      ))}
      {!list.length && <p className="mini">{hasData ? 'Không có công ty đủ tin với bộ lọc đang chọn.' : 'Demo chưa có dữ liệu công ty cho ngành này.'}</p>}
    </Card>
  );
}
