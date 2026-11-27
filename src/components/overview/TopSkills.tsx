'use client';
// Kỹ năng được nhắc nhiều trong tin đang mở. Bấm một kỹ năng để sang trang Công ty đã lọc sẵn.
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { EmptyFilterNote, SampleSize } from '@/components/ui/Reliability';
import { useFilters } from '@/context/FilterContext';
import { MIN_SAMPLE } from '@/lib/constants';
import type { OverviewData } from '@/lib/market';

export function TopSkills({ d, subtitle }: { d: OverviewData; subtitle: string }) {
  const { setSkill } = useFilters();
  const router = useRouter();
  const title = 'Kỹ năng được nhắc nhiều';
  if (d.n < MIN_SAMPLE) return <Card title={title} subtitle={subtitle}><EmptyFilterNote n={d.n} /></Card>;
  const max = Math.max(1, ...d.skills.map((s) => s.pct));
  return (
    <Card title={title} subtitle={`${subtitle} · % tin có nhắc, một tin có thể nhắc nhiều kỹ năng`} action={<SampleSize n={d.n} />}>
      {d.skills.map((s) => (
        <div key={s.name} className="sk" style={{ cursor: 'pointer' }} title={`Xem công ty tuyển ${s.name}`} onClick={() => { setSkill(s.name); router.push('/companies'); }}>
          <span>{s.name}</span>
          <div className="trk"><i style={{ width: `${(s.pct / max) * 100}%` }} /></div>
          <b style={{ textAlign: 'right' }}>{Math.round(s.pct)}%</b>
          <span className="mini" style={{ textAlign: 'right' }}>{s.n} tin</span>
        </div>
      ))}
      {!d.skills.length && <p className="mini">Chưa nhận ra kỹ năng nào trong các tin này.</p>}
      <p className="foot">Kỹ năng nhận ra bằng từ khóa trong chức danh và mô tả. Tin chỉ ghi chung chung (ví dụ IT support) thường không có kỹ năng nào.</p>
    </Card>
  );
}
