// Thẻ "Lương công bố theo nhóm nghề": thanh P25–P75 và vạch trung vị.
// Dưới MIN_SALARY_SAMPLE tin có lương: không hiện số. Từ đó đến MIN_SAMPLE: hiện kèm nhãn "mẫu nhỏ".
import { Card } from '@/components/ui/Card';
import { NotEnough, SampleSize } from '@/components/ui/Reliability';
import { MIN_SALARY_SAMPLE, MIN_SAMPLE } from '@/lib/constants';
import type { GroupRow, OverviewData } from '@/lib/market';

function axisRange(groups: GroupRow[]): { lo: number; hi: number } {
  if (!groups.length) return { lo: 0, hi: 10 };
  const lo = Math.min(...groups.map((g) => g.salary!.p25));
  const hi = Math.max(...groups.map((g) => g.salary!.p75));
  return { lo: Math.max(0, Math.floor(lo - 2)), hi: Math.ceil(hi + 2) };
}

export function SalaryRanges({ d, subtitle }: { d: OverviewData; subtitle: string }) {
  const n = (g: GroupRow) => g.salary?.n ?? 0;
  const enough = d.groups.filter((g) => n(g) >= MIN_SALARY_SAMPLE).sort((a, b) => b.salary!.med - a.salary!.med);
  const rest = d.groups.filter((g) => n(g) < MIN_SALARY_SAMPLE);
  const totalN = d.groups.reduce((s, g) => s + n(g), 0);
  const { lo, hi } = axisRange(enough);
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100;

  return (
    <Card action={<SampleSize n={totalN} />} title="Lương công bố theo nhóm nghề" subtitle={`${subtitle} · thanh = P25–P75, vạch đen = trung vị · triệu VND/tháng`}>
      {[...enough, ...rest].map((g) => {
        const ok = n(g) >= MIN_SALARY_SAMPLE;
        const small = ok && n(g) < MIN_SAMPLE;
        return (
          <div key={g.id} className={`sal ${ok && !small ? '' : 'low'} ${d.selected?.id === g.id ? 'on' : ''}`}>
            <span>{g.name}<div className="mini">n={n(g)}{small ? ' · mẫu nhỏ' : ''}</div></span>
            {ok ? (
              <div className="rg">
                <b style={{ left: `${pos(g.salary!.p25)}%`, width: `${Math.max(1, pos(g.salary!.p75) - pos(g.salary!.p25))}%` }} />
                <u style={{ left: `calc(${pos(g.salary!.med)}% - 1px)` }} />
              </div>
            ) : (
              <div><NotEnough n={n(g)} /></div>
            )}
            <span className="m">{ok ? `${g.salary!.med.toFixed(0)} tr` : '—'}</span>
          </div>
        );
      })}
      {enough.length > 0 && <div className="axis"><span /><div><span>{lo} tr</span><span>{Math.round((lo + hi) / 2)} tr</span><span>{hi} tr</span></div><span /></div>}
      <p className="foot">Lương một tin = điểm giữa khoảng công bố. Nhóm dưới {MIN_SALARY_SAMPLE} tin có lương không hiện số; dưới {MIN_SAMPLE} tin ghi &quot;mẫu nhỏ&quot;, chỉ nên tham khảo.</p>
    </Card>
  );
}
