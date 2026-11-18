import { pct } from '@/lib/stats';
import type { OverviewData } from '@/lib/overview';
import { MIN_SAMPLE } from '@/lib/constants';
import { EmptyFilterNote } from '@/components/ui/Reliability';

/** Ba câu nhận định tự sinh từ số liệu */
export function InsightsCard({ d }: { d: OverviewData }) {
  const { G, tot, S, jobs, jp } = d;
  // Quá ít tin thì các nhận định không đáng tin (và 0 tin thì không chia được)
  if (tot < MIN_SAMPLE) return <div className="card ins"><h3>Điểm nhấn tự động</h3><EmptyFilterNote n={tot} /></div>;
  const fastest = [...G].map((g) => ({ ...g, d: pct(g.jobs, g.prev) })).sort((a, b) => b.d - a.d)[0];
  const top = G.reduce((a, b) => (a.med > b.med ? a : b));
  const big = G.reduce((a, b) => (a.jobs > b.jobs ? a : b));
  const low = G.filter((g) => g.n < MIN_SAMPLE);
  const ch = pct(jobs, jp);
  return (
    <div className="card ins">
      <h3>Điểm nhấn tự động</h3>
      <p><span>Tin mới {ch >= 0 ? 'tăng' : 'giảm'} <b>{Math.abs(ch).toFixed(0)}%</b> so với kỳ trước{!S && <>; <b>{fastest.name}</b> tăng nhanh nhất ({fastest.d >= 0 ? '+' : ''}{fastest.d.toFixed(0)}%)</>}.</span></p>
      <p><span><b>{big.name}</b> chiếm nhiều tin nhất ({((big.jobs / tot) * 100).toFixed(0)}%), còn <b>{top.name}</b> có lương trung vị cao nhất ({top.med.toFixed(0)} tr) với {((top.jobs / tot) * 100).toFixed(0)}% nhu cầu.</span></p>
      <p><span>{low.length ? `${low.length} nhóm (${low.map((x) => x.name).join(', ')}) chưa đủ ${MIN_SAMPLE} tin có lương, nên số liệu lương chỉ để tham khảo.` : `Mọi nhóm đều đủ ${MIN_SAMPLE} tin có lương trở lên.`}</span></p>
    </div>
  );
}
