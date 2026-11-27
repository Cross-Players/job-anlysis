// Danh sách tin đang mở của công ty, khớp bộ lọc. Chỉ hiện dữ kiện và link về tin gốc, không chép nội dung tin.
import type { SnapshotJob } from '@/api/snapshot';
import { Card } from '@/components/ui/Card';
import { CITIES, SOURCE_LABELS } from '@/lib/constants';
import { levelLabel, modeLabel, salaryText, viDate } from '@/lib/market';

export function ProfileJobs({ jobs }: { jobs: SnapshotJob[] }) {
  return (
    <Card title="Vị trí đang mở" subtitle="Bấm để xem tin gốc trên trang tuyển dụng">
      {jobs.map((j) => {
        const mode = modeLabel(j.mode);
        return (
          <a key={j.id} className="job" href={j.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            <span>
              <b>{j.title}</b>
              <span className="mini"> · {levelLabel(j.level)}{mode ? ` · ${mode}` : ''} · {j.cities.map((c) => CITIES.find((x) => x.key === c)?.label ?? c).join(', ')} · đăng {viDate(j.posted)} · {SOURCE_LABELS[j.source] ?? j.source} ↗</span>
            </span>
            <span><b>{salaryText(j.salaryMin, j.salaryMax)}</b></span>
          </a>
        );
      })}
      {!jobs.length && <p className="mini">Không có vị trí nào khớp bộ lọc đang chọn.</p>}
    </Card>
  );
}
