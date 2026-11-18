import { Card } from '@/components/ui/Card';
import type { OverviewData } from '@/lib/overview';
import { MIN_SAMPLE } from '@/lib/constants';
import { EmptyFilterNote, SampleSize } from '@/components/ui/Reliability';

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Thay cho biểu đồ bong bóng: mỗi nhóm một dòng, hai thanh nhu cầu và lương, kèm nhãn chữ */
export function DemandVsSalary({ d }: { d: OverviewData }) {
  const { G, tot } = d;
  const title = 'Nhóm nào nhiều việc, nhóm nào lương cao?';
  // Quá ít tin thì % nhu cầu không có ý nghĩa (và 0 tin thì không chia được)
  if (tot < MIN_SAMPLE) return <Card title={title}><EmptyFilterNote n={tot} /></Card>;
  const mdShare = median(G.map((g) => g.jobs / tot));
  const mdSal = median(G.map((g) => g.med));
  const mxShare = Math.max(...G.map((g) => g.jobs / tot));
  const mxSal = Math.max(...G.map((g) => g.med));
  const tag = (share: number, sal: number) => {
    const a = share >= mdShare, b = sal >= mdSal;
    return a && b ? 'Nhiều việc, lương cao' : a ? 'Nhiều việc' : b ? 'Lương cao' : 'Dưới mặt bằng chung';
  };
  return (
    <Card title={title} action={<SampleSize n={tot} />} subtitle="Nhãn so với trung vị của các nhóm đang hiển thị · đây là hiện trạng, không phải dự báo">
      <div className="ds h"><span>Nhóm nghề</span><span>Nhu cầu (% tin mới)</span><span>Lương trung vị</span><span>Nhận xét</span></div>
      {[...G].sort((a, b) => b.jobs - a.jobs).map((g) => {
        const share = g.jobs / tot;
        const t = tag(share, g.med);
        return (
          <div key={g.id} className={`ds ${g.n < MIN_SAMPLE ? 'low' : ''}`}>
            <span>{g.name}{g.n < MIN_SAMPLE && <div className="mini">mẫu nhỏ</div>}</span>
            <div className="bw"><span className="v">{(share * 100).toFixed(0)}%</span><div className="trk"><i style={{ width: `${(share / mxShare) * 100}%` }} /></div></div>
            <div className="bw"><span className="v">{g.med.toFixed(0)} tr</span><div className="trk"><i style={{ width: `${(g.med / mxSal) * 100}%` }} /></div></div>
            <span className={`pill ${t === 'Nhiều việc, lương cao' ? 'hi' : ''}`}>{t}</span>
          </div>
        );
      })}
    </Card>
  );
}
