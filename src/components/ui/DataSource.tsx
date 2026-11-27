// Dòng ghi nguồn và độ phủ, đặt cuối mọi trang: người xem biết số lấy từ đâu, cập nhật lúc nào, phủ được bao nhiêu.
import type { Snapshot } from '@/api/snapshot';
import { SOURCE_LABELS } from '@/lib/constants';
import { viDate } from '@/lib/market';

function viDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })} ${d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;
}

export function DataSource({ snap }: { snap: Snapshot }) {
  const active = snap.sources.filter((s) => s.status === 'ok' || s.open > 0);
  return (
    <p className="foot">
      Nguồn: {active.length ? active.map((s) => {
        const coverage = s.listed ? ` · đọc được ${s.open}/${s.listed} tin đang mở` : '';
        return `${SOURCE_LABELS[s.name] ?? s.name}${coverage}`;
      }).join('; ') : 'chưa có'}.
      {' '}Cập nhật {viDateTime(snap.generatedAt)}. Thu thập từ {viDate(snap.trackingSince)}.
      {' '}Chỉ tính tin IT và Chuỗi cung ứng (SCM) đang mở ở Hà Nội, Đà Nẵng, TP.HCM; đã loại {snap.excluded.notIt} tin không khớp ngành
      {' '}và {snap.excluded.outOfScope} tin ở tỉnh khác. Nhóm nghề, cấp bậc, hình thức làm việc, kỹ năng phân loại tự động theo từ khóa trong tin, có thể sai.
    </p>
  );
}
