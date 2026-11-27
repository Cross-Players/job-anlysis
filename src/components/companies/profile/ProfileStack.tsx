import { Card } from '@/components/ui/Card';
import { MIN_COMPANY_JOBS_FOR_STACK } from '@/lib/constants';
import type { Share } from '@/lib/market';

export function ProfileStack({ stack, n }: { stack: Share[] | null; n: number }) {
  return (
    <Card title="Kỹ năng công ty đang tuyển" subtitle="% tin của công ty nhắc đến kỹ năng">
      {stack === null && <p className="mini">Công ty có {n} tin khớp bộ lọc, cần ít nhất {MIN_COMPANY_JOBS_FOR_STACK} tin để tổng hợp kỹ năng.</p>}
      {stack?.map((s) => (
        <div key={s.name} className="sk"><span>{s.name}</span><div className="trk"><i style={{ width: `${s.pct}%` }} /></div><b>{Math.round(s.pct)}%</b></div>
      ))}
      {stack && !stack.length && <p className="mini">Chưa nhận ra kỹ năng cụ thể nào trong các tin của công ty.</p>}
      <p className="foot">Đây là kỹ năng công ty đang <b>tuyển</b>, chưa chắc đã là stack đang chạy production.</p>
    </Card>
  );
}
