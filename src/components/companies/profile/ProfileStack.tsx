import { Card } from '@/components/ui/Card';
import type { Company } from '@/lib/types';

export function ProfileStack({ c }: { c: Company }) {
  return (
    <Card title="Stack suy ra từ tin tuyển dụng" subtitle="% tin của công ty nhắc đến kỹ năng · chỉ tính kỹ năng xuất hiện từ 3 tin">
      {c.stack.map(([n, p]) => (
        <div key={n} className="sk"><span>{n}</span><div className="trk"><i style={{ width: `${p}%` }} /></div><b>{p}%</b></div>
      ))}
      <p className="foot">Đây là stack công ty đang <b>tuyển</b>, chưa chắc đã là stack đang chạy production.</p>
    </Card>
  );
}
