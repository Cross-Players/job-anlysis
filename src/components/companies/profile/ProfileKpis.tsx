import { Delta } from '@/components/ui/Delta';
import type { Company } from '@/lib/types';

export function ProfileKpis({ c }: { c: Company }) {
  const weeks = c.w.length;
  const diff = Math.abs((c.ratio - 1) * 100).toFixed(0);
  return (
    <div className="card kp">
      <div><div className="l">Tin đang mở</div><div className="v">{c.open}</div></div>
      <div><div className="l">Tin mới {weeks} tuần</div><div className="v">{c.j}</div><div className="d">{c.j >= 6 && <Delta value={c.g} digits={0} />} <span className="mini">vs {weeks} tuần trước</span></div></div>
      <div><div className="l">Tuổi thọ tin trung bình</div><div className="v">{c.age} ngày</div><div className="mini">Càng lâu càng khó tuyển</div></div>
      <div><div className="l">Lương vs nhóm tương đương</div><div className={`v ${c.ratio >= 1 ? 'up' : 'dn'}`}>{c.ratio >= 1 ? '+' : '−'}{diff}%</div><div className="mini">{Math.round(c.disc * 100)}% tin công khai lương</div></div>
    </div>
  );
}
