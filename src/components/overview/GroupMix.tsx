// Thẻ "Cơ cấu theo ngành" (khi xem tất cả) hoặc "Cơ cấu nhóm nghề" (trong một ngành).
// Trên: biểu đồ tròn. Dưới: danh sách có ô màu, %, và thay đổi so với kỳ trước.
// Bấm vào lát hoặc dòng để lọc cả trang.
import { Card } from '@/components/ui/Card';
import { Delta } from '@/components/ui/Delta';
import { MixPie, seriesColor, type PieSlice } from '@/components/charts/MixPie';
import { IND } from '@/data/overview';
import { pct } from '@/lib/stats';
import type { OverviewData } from '@/lib/overview';
import { cityLabel } from '@/lib/cities';
import { EmptyFilterNote, SampleSize } from '@/components/ui/Reliability';
import { MIN_SAMPLE } from '@/lib/constants';

interface Props { d: OverviewData; ind: string; sel: string | null; onPick: (id: string) => void }

export function GroupMix({ d, ind, sel, onPick }: Props) {
  const { G, tot } = d;

  // Gán màu theo thứ tự gốc của dữ liệu (trước khi sắp xếp) để màu không đổi khi thứ hạng đổi
  const slices: PieSlice[] = G.map((g, index) => ({
    id: g.id,
    name: g.name,
    value: g.jobs,
    color: seriesColor(index),
  }));

  // Danh sách bên dưới thì sắp từ lớn đến nhỏ cho dễ đọc
  const rows = [...G].sort((a, b) => b.jobs - a.jobs);

  const title = ind === 'all' ? 'Cơ cấu theo ngành' : `Cơ cấu nhóm nghề · ${IND[ind].name}`;
  const subtitle = `${cityLabel(d.city)} · tỷ trọng tin mới · so với kỳ trước · bấm để lọc cả trang`;

  // Quá ít tin thì tỷ trọng không có ý nghĩa (và 0 tin thì không chia được)
  if (tot < MIN_SAMPLE) return <Card title={title} subtitle={subtitle}><EmptyFilterNote n={tot} /></Card>;

  return (
    <Card title={title} subtitle={subtitle} action={<SampleSize n={tot} />}>
      <MixPie slices={slices} total={tot} selectedId={sel} onPick={onPick} />

      {rows.map((g) => {
        const slice = slices.find((s) => s.id === g.id);
        const color = slice ? slice.color : 'var(--mut)';
        const percent = ((g.jobs / tot) * 100).toFixed(0);

        let rowClass = 'fam';
        if (sel === g.id) rowClass += ' on';
        if (sel && sel !== g.id) rowClass += ' dim';

        return (
          <div key={g.id} className={rowClass} onClick={() => onPick(g.id)}>
            <i className="sw" style={{ background: color }} />
            <span className="n">{g.name}</span>
            <span className="pc">{percent}%</span>
            <Delta value={pct(g.jobs, g.prev)} digits={0} />
          </div>
        );
      })}

      <p className="foot">{ind === 'all' ? 'Bấm một ngành để xem chi tiết nhóm nghề bên trong.' : 'Bấm lần nữa để bỏ chọn.'}</p>
    </Card>
  );
}
