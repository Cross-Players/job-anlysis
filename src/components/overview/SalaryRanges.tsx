// Thẻ "Lương công bố theo nhóm nghề": thanh P25–P75 và vạch trung vị.
// Nhóm có dưới MIN_SAMPLE tin công khai lương thì KHÔNG hiện số lương (quá ít để tin được),
// thay bằng nhãn "Chưa đủ dữ liệu". Thang trục chỉ tính trên các nhóm đủ dữ liệu.
import { Card } from '@/components/ui/Card';
import type { OverviewData } from '@/lib/overview';
import type { Group } from '@/lib/types';
import { cityLabel } from '@/lib/cities';
import { MIN_SAMPLE } from '@/lib/constants';
import { NotEnough, SampleSize } from '@/components/ui/Reliability';

/** Khoảng trục lương [thấp, cao] bao trọn các nhóm đủ dữ liệu, chừa 2 triệu mỗi bên */
function axisRange(groups: Group[]): { lo: number; hi: number } {
  if (groups.length === 0) return { lo: 0, hi: 10 };
  let min = Infinity;
  let max = -Infinity;
  for (const g of groups) {
    if (g.p25 < min) min = g.p25;
    if (g.p75 > max) max = g.p75;
  }
  return { lo: Math.max(0, Math.floor(min - 2)), hi: Math.ceil(max + 2) };
}

export function SalaryRanges({ d }: { d: OverviewData }) {
  const { G, S } = d;
  let totalN = 0;
  for (const g of G) totalN += g.n;

  const enough = G.filter((g) => g.n >= MIN_SAMPLE);
  const notEnough = G.filter((g) => g.n < MIN_SAMPLE);
  // Nhóm đủ dữ liệu sắp theo lương giảm dần, nhóm thiếu dữ liệu xếp cuối
  const rows = [...enough.sort((a, b) => b.med - a.med), ...notEnough];

  const { lo, hi } = axisRange(enough);
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100;

  return (
    <Card action={<SampleSize n={totalN} />} title="Lương công bố theo nhóm nghề" subtitle={`${cityLabel(d.city)} · thanh = P25–P75, vạch đen = trung vị · triệu VND/tháng`}>
      {rows.map((g) => {
        const isEnough = g.n >= MIN_SAMPLE;
        return (
          <div key={g.id} className={`sal ${isEnough ? '' : 'low'} ${S?.id === g.id ? 'on' : ''}`}>
            <span>{g.name}<div className="mini">n={g.n}</div></span>
            {isEnough ? (
              <div className="rg">
                <b style={{ left: `${pos(g.p25)}%`, width: `${pos(g.p75) - pos(g.p25)}%` }} />
                <u style={{ left: `calc(${pos(g.med)}% - 1px)` }} />
              </div>
            ) : (
              <div><NotEnough n={g.n} /></div>
            )}
            <span className="m">{isEnough ? `${g.med.toFixed(0)} tr` : '—'}</span>
          </div>
        );
      })}
      <div className="axis"><span /><div><span>{lo} tr</span><span>{Math.round((lo + hi) / 2)} tr</span><span>{hi} tr</span></div><span /></div>
      <p className="foot">Nhóm có dưới {MIN_SAMPLE} tin công khai lương không hiện số lương vì quá ít để tin được.</p>
    </Card>
  );
}
