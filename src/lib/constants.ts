// Các hằng số dùng chung: ngưỡng cỡ mẫu, danh sách ngành / thành phố / cấp bậc / hình thức, bộ lọc mặc định.
import type { City, Filters, Level, Sector, WorkMode } from './types';

/** Dưới số tin này thì hiện "Chưa đủ dữ liệu" thay vì hiện số (tỷ trọng, lương trung vị) */
export const MIN_SAMPLE = 30;

/** Lương theo nhóm nghề: từ ngưỡng này hiện số kèm nhãn "mẫu nhỏ", đủ MIN_SAMPLE thì bỏ nhãn */
export const MIN_SALARY_SAMPLE = 10;

/** Kỹ năng / stack của một công ty chỉ tính khi công ty có từ chừng này tin */
export const MIN_COMPANY_JOBS_FOR_STACK = 3;

/** Xu hướng theo tuần và dự báo chỉ hiện khi đã thu thập đều được chừng này tuần (spec mục 8) */
export const MIN_TREND_WEEKS = 8;

/** Hình thức làm việc chỉ cho lọc khi có từ chừng này tin ghi rõ hình thức */
export const MIN_MODE_COVERAGE = MIN_SAMPLE;

export const SECTORS: { key: Sector; label: string }[] = [
  { key: 'it', label: 'IT / Công nghệ' },
  { key: 'scm', label: 'Chuỗi cung ứng (SCM)' },
];

export const CITIES: { key: City; label: string }[] = [
  { key: 'hn', label: 'Hà Nội' },
  { key: 'dn', label: 'Đà Nẵng' },
  { key: 'hcm', label: 'TP.HCM' },
];

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

export const DEFAULT_FILTERS: Filters = { sector: 'all', city: 'all', level: 'all', mode: 'all' };

export const SOURCE_LABELS: Record<string, string> = { vieclam24h: 'Vieclam24h', itviec: 'ITviec' };
