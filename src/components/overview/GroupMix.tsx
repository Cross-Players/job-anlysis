// Thẻ "Cơ cấu nhóm nghề": biểu đồ tròn + danh sách. Bấm lát hoặc dòng để lọc cả trang theo nhóm đó.
import { Card } from '@/components/ui/Card';
import { MixPie, seriesColor, type PieSlice } from '@/components/charts/MixPie';
import { EmptyFilterNote, SampleSize } from '@/components/ui/Reliability';
import { MIN_SAMPLE } from '@/lib/constants';
import type { OverviewData } from '@/lib/market';

interface Props { d: OverviewData; groupOrder: string[]; subtitle: string; onPick: (id: string) => void }

export function GroupMix({ d, groupOrder, subtitle, onPick }: Props) {
  const { groups, groupTotal: tot } = d;
  const sel = d.selected?.id ?? null;
  // Màu gắn theo thứ tự cố định của danh mục nhóm (không theo thứ hạng) để màu không đổi khi lọc
  const colorOf = (id: string) => seriesColor(Math.max(0, groupOrder.indexOf(id)));
  const slices: PieSlice[] = groups.map((g) => ({ id: g.id, name: g.name, value: g.n, color: colorOf(g.id) }));
  const title = 'Cơ cấu nhóm nghề';

  if (tot < MIN_SAMPLE) return <Card title={title} subtitle={subtitle}><EmptyFilterNote n={tot} /></Card>;

  return (
    <Card title={title} subtitle={`${subtitle} · bấm để lọc cả trang`} action={<SampleSize n={tot} />}>
      <MixPie slices={slices} total={tot} selectedId={sel} onPick={onPick} centerLabel="tin đang mở" />
      {groups.map((g) => {
        let rowClass = 'fam';
        if (sel === g.id) rowClass += ' on';
        if (sel && sel !== g.id) rowClass += ' dim';
        return (
          <div key={g.id} className={rowClass} onClick={() => onPick(g.id)}>
            <i className="sw" style={{ background: colorOf(g.id) }} />
            <span className="n">{g.name}</span>
            <span className="pc">{((g.n / tot) * 100).toFixed(0)}%</span>
            <span className="mini" style={{ textAlign: 'right' }}>{g.n} tin</span>
          </div>
        );
      })}
      <p className="foot">{sel ? 'Bấm lần nữa để bỏ chọn.' : 'Phân nhóm theo từ khóa trong chức danh.'}</p>
    </Card>
  );
}
