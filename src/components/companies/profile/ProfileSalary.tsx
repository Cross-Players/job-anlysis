import { Card } from '@/components/ui/Card';
import { RatioBadge } from '@/components/ui/Delta';
import type { PeerRow } from '@/lib/profile';
import { cityLabel } from '@/lib/cities';
import type { Filters } from '@/lib/types';

export function ProfileSalary({ rows, f }: { rows: PeerRow[]; f: Filters }) {
  const scope = f.city === 'all' ? 'cả 3 thành phố' : cityLabel(f.city);
  const hi = 70;
  return (
    <Card title="Lương so với vị trí tương đương" subtitle={`Trung vị công bố, triệu VND/tháng · vạch đen là trung vị nhóm tương đương · ${scope}`}>
      <div className="cmp h"><span>Vị trí</span><span>Công ty</span><span>Nhóm TĐ</span><span>Chênh</span><span /></div>
      {rows.map((x) => (
        <div key={x.role} className="cmp" style={x.n < 15 ? { opacity: 0.55 } : undefined}>
          <span>{x.role}<div className="mini">Nhóm TĐ: {x.role} · {scope}</div><div className="mini">{x.n < 15 ? 'mẫu nhỏ · ' : ''}n={x.n}</div></span>
          <b>{x.mine} tr</b><span>{x.peer} tr</span><RatioBadge ratio={x.ratio} />
          <div className="pv"><b style={{ left: 0, width: `${Math.min(100, (x.mine / hi) * 100)}%` }} /><i style={{ left: `${Math.min(100, (x.peer / hi) * 100)}%` }} /></div>
        </div>
      ))}
      <p className="foot">Nhóm tương đương: cùng chức danh, cùng thành phố ({scope}), cùng cấp bậc nếu đang lọc cấp bậc. Không chia theo lĩnh vực. Hệ số lương theo thành phố là số mô phỏng.</p>
    </Card>
  );
}
