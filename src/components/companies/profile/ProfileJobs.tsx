// Danh sách vị trí đang mở của công ty, đã lọc theo thành phố, cấp bậc, hình thức làm việc
import { Card } from '@/components/ui/Card';
import type { OpenJob } from '@/lib/profile';
import { cityLabel } from '@/lib/cities';
import { LEVELS, WORK_MODES } from '@/lib/constants';
import type { Filters, Level, WorkMode } from '@/lib/types';

function levelLabel(level: Level): string {
  const found = LEVELS.find((l) => l.key === level);
  return found ? found.label : level;
}

function modeLabel(mode: WorkMode): string {
  const found = WORK_MODES.find((m) => m.key === mode);
  return found ? found.label : mode;
}

export function ProfileJobs({ jobs, f }: { jobs: OpenJob[]; f: Filters }) {
  return (
    <Card title="Vị trí đang mở" subtitle={`${cityLabel(f.city)} · hình thức làm việc lấy từ nội dung tin`}>
      {jobs.map((j) => (
        <div key={`${j.title}-${j.level}-${j.city}`} className="job">
          <span><b>{j.title}</b> <span className="mini">· {levelLabel(j.level)} · {cityLabel(j.city)}</span></span>
          <span><span className={`bd ${j.mode === 'onsite' ? 'm' : ''}`}>{modeLabel(j.mode)}</span><b>{j.salary} tr</b></span>
        </div>
      ))}
      {!jobs.length && <p className="mini">Không có vị trí nào khớp bộ lọc đang chọn.</p>}
    </Card>
  );
}
