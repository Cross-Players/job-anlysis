// Thẻ "Theo cấp bậc": số tin mỗi cấp và tỷ lệ tin nhận người mới (Intern/Fresher/Junior).
import { Card } from '@/components/ui/Card';
import { EmptyFilterNote, SampleSize } from '@/components/ui/Reliability';
import { MIN_SAMPLE } from '@/lib/constants';
import type { OverviewData } from '@/lib/market';

export function LevelMix({ d, subtitle }: { d: OverviewData; subtitle: string }) {
  const title = 'Theo cấp bậc';
  if (d.n < MIN_SAMPLE) return <Card title={title} subtitle={subtitle}><EmptyFilterNote n={d.n} /></Card>;
  const max = Math.max(1, ...d.levels.map((l) => l.n));
  return (
    <Card title={title} subtitle={`${subtitle} · cấp bậc suy từ chức danh và số năm kinh nghiệm yêu cầu`} action={<SampleSize n={d.n} />}>
      {d.levels.map((l) => (
        <div key={l.label} className="sk">
          <span className={l.key ? '' : 'mini'}>{l.label}</span>
          <div className="trk"><i style={{ width: `${(l.n / max) * 100}%`, opacity: l.key ? 1 : 0.35 }} /></div>
          <b style={{ textAlign: 'right' }}>{l.n}</b>
          <span className="mini" style={{ textAlign: 'right' }}>{Math.round((l.n / d.n) * 100)}%</span>
        </div>
      ))}
      <p className="foot">
        {d.levelKnown >= MIN_SAMPLE
          ? <>Thân thiện với người mới: <b>{Math.round(d.newcomerPct)}%</b> tin ghi rõ cấp bậc là Intern, Fresher hoặc Junior.</>
          : <>Chỉ {d.levelKnown} tin ghi rõ cấp bậc, chưa đủ để tính tỷ lệ tin nhận người mới.</>}
      </p>
    </Card>
  );
}
