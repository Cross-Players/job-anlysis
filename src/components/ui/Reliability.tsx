// Các nhãn cho biết số liệu đáng tin đến đâu, dùng chung ở mọi trang:
// - SampleSize: cỡ mẫu "n = 120 tin"
// - NotEnough: thay con số khi dưới MIN_SAMPLE tin
// - StatusBadge: "Ước lượng" (dựng lại từ quá khứ) hoặc "Dự báo" (không phải số thật)
import { MIN_SAMPLE } from '@/lib/constants';

export function SampleSize({ n }: { n: number }) {
  return <span className="mini">n = {n.toLocaleString('vi-VN')} tin</span>;
}

export function NotEnough({ n }: { n: number }) {
  return (
    <span className="nen" title={`Chỉ có ${n} tin, cần ít nhất ${MIN_SAMPLE}`}>
      Chưa đủ dữ liệu
    </span>
  );
}

const BADGE_TEXT = {
  estimate: { label: 'Ước lượng', tip: 'Dựng lại từ tin còn mở, có thể thiếu tin đã đóng' },
  forecast: { label: 'Dự báo', tip: 'Dự báo bằng đường xu hướng, không phải số thật' },
};

export function StatusBadge({ kind }: { kind: 'estimate' | 'forecast' }) {
  const text = BADGE_TEXT[kind];
  return (
    <span className={`badge ${kind === 'estimate' ? 'est' : 'fc'}`} title={text.tip}>
      {text.label}
    </span>
  );
}

/** Thông báo khi bộ lọc không còn tin nào, dùng bên trong một thẻ */
export function EmptyFilterNote({ n }: { n: number }) {
  return (
    <p className="mini">
      <NotEnough n={n} /> Không đủ tin khớp bộ lọc đang chọn. Thử bỏ bớt bộ lọc cấp bậc, hình thức hoặc thành phố.
    </p>
  );
}
