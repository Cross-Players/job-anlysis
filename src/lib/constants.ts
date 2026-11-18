// Các hằng số dùng chung: ngưỡng cỡ mẫu, danh sách cấp bậc / hình thức, bộ lọc mặc định.
// Gom về một chỗ để khi cần chỉnh (ví dụ ngưỡng 30 tin) chỉ sửa ở đây.
import type { Filters, Level, WorkMode } from './types';

/** Dưới số tin này thì hiện "Chưa đủ dữ liệu" thay vì hiện số */
export const MIN_SAMPLE = 30;

/** Dữ liệu mẫu có 48 tuần: 24 tuần kỳ này + 24 tuần kỳ trước */
export const TOTAL_WEEKS = 48;

// 12 tuần cũ nhất trong 24 tuần gần đây là "ước lượng":
// giả lập việc mới bắt đầu cào đều từ 12 tuần trước, phần trước đó dựng lại từ quá khứ.
// Đây là chỉ số trong mảng 48 tuần (0 = cũ nhất).
export const ESTIMATED_WEEKS = { from: 24, to: 35 };

export const LEVELS: { key: Level; label: string }[] = [
  { key: 'intern', label: 'Intern' },
  { key: 'fresher', label: 'Fresher' },
  { key: 'junior', label: 'Junior' },
  { key: 'middle', label: 'Middle' },
  { key: 'senior', label: 'Senior' },
  { key: 'lead', label: 'Lead+' },
];

export const WORK_MODES: { key: WorkMode; label: string }[] = [
  { key: 'onsite', label: 'Onsite' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'remote', label: 'Remote' },
];

/** Các cấp được tính là "nhận người mới" */
export const NEWCOMER_LEVELS: Level[] = ['intern', 'fresher', 'junior'];

/** Lương của từng cấp so với mặt bằng chung (Middle = 1). Số mô phỏng. */
export const LEVEL_SALARY_FACTOR: Record<Level, number> = {
  intern: 0.35,
  fresher: 0.55,
  junior: 0.75,
  middle: 1,
  senior: 1.35,
  lead: 1.7,
};

export const DEFAULT_FILTERS: Filters = { weeks: 12, city: 'all', level: 'all', mode: 'all' };
