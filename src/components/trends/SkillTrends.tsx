// Kỹ năng của nghề đang chọn: tỷ trọng hiện tại (% tin có nhắc) và hướng đi của từng kỹ năng.
// Nghề không đủ tin thì không hiện danh sách, để không đưa ra tỷ lệ từ quá ít tin.
import { Card } from '@/components/ui/Card';
import { EmptyFilterNote } from '@/components/ui/Reliability';
import type { SkillTrend } from '@/api/types';
import { DirectionTag } from './CareerTable';

interface Props { skills: SkillTrend[]; groupName: string; enoughData: boolean }

export function SkillTrends({ skills, groupName, enoughData }: Props) {
  const title = `Kỹ năng của nghề ${groupName}`;
  // Dữ liệu mẫu chưa chia kỹ năng theo thành phố / cấp bậc / hình thức, nên ghi rõ ở phụ đề
  const subtitle = '% tin có nhắc kỹ năng · hướng đi dự báo 12 tuần tới · mô phỏng, chưa đổi theo thành phố, cấp bậc, hình thức';

  if (!enoughData) return <Card title={title} subtitle={subtitle}><EmptyFilterNote n={0} /></Card>;

  let maxShare = 1;
  for (const s of skills) if (s.sharePct > maxShare) maxShare = s.sharePct;

  return (
    <Card title={title} subtitle={subtitle}>
      {skills.map((s) => (
        <div key={s.name} className="sk">
          <span>{s.name}</span>
          <div className="trk"><i style={{ width: `${(s.sharePct / maxShare) * 100}%` }} /></div>
          <b style={{ textAlign: 'right' }}>{s.sharePct}%</b>
          <DirectionTag direction={s.direction} />
        </div>
      ))}
      {!skills.length && <p className="mini">Chưa có dữ liệu kỹ năng.</p>}
    </Card>
  );
}
