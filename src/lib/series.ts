// Các hàm lọc dữ liệu 48 tuần của nhóm nghề theo bộ lọc (thời gian, thành phố, cấp bậc, hình thức).
// Dữ liệu mẫu chỉ có số tổng, nên lọc bằng cách nhân tỷ trọng. Khi có backend,
// backend sẽ trả thẳng số đã lọc và các hàm nhân hệ số này không cần nữa.
import { GROUP_SERIES } from '@/data/series';
import { CITY_SALARY_FACTOR, CITY_SHARE } from '@/data/cities';
import { LEVEL_SALARY_FACTOR, MIN_SAMPLE } from './constants';
import { FIT_WEEKS } from './forecast';
import type { Filters, Group, GroupSeries } from './types';

/**
 * Tổng `weeks` phần tử, kết thúc cách cuối mảng `offset` phần tử.
 * Ví dụ windowSum([1,2,3,4,5], 2) = 4 + 5; windowSum([1,2,3,4,5], 2, 2) = 2 + 3.
 */
export function windowSum(values: number[], weeks: number, offset = 0): number {
  const end = values.length - offset;
  const start = Math.max(0, end - weeks);
  let total = 0;
  for (let i = start; i < end; i++) total += values[i];
  return total;
}

/** Trung bình của `weeks` phần tử, cách cuối mảng `offset` phần tử */
export function windowAverage(values: number[], weeks: number, offset = 0): number {
  const end = values.length - offset;
  const start = Math.max(0, end - weeks);
  if (end <= start) return 0;
  return windowSum(values, weeks, offset) / (end - start);
}

/** Phần tin còn lại sau khi lọc theo thành phố, cấp bậc, hình thức (0–1) */
export function filterFactor(g: GroupSeries, f: Filters): number {
  const cityShare = f.city === 'all' ? 1 : CITY_SHARE[g.industry][f.city];
  const levelShare = f.level === 'all' ? 1 : g.levelShare[f.level];
  const modeShare = f.mode === 'all' ? 1 : g.modeShare[f.mode];
  return cityShare * levelShare * modeShare;
}

/** Hệ số lương theo thành phố và cấp bậc (hình thức làm việc không đổi lương) */
export function salaryFactor(f: Filters): number {
  const city = f.city === 'all' ? 1 : CITY_SALARY_FACTOR[f.city];
  const level = f.level === 'all' ? 1 : LEVEL_SALARY_FACTOR[f.level];
  return city * level;
}

/** Số tin mỗi tuần (48 tuần) sau khi lọc */
export function groupWeekly(g: GroupSeries, f: Filters): number[] {
  const factor = filterFactor(g, f);
  const result: number[] = [];
  for (const jobs of g.weeklyJobs) result.push(Math.round(jobs * factor));
  return result;
}

/** Lương trung vị mỗi tuần (48 tuần) sau khi nhân hệ số */
export function groupWeeklySalary(g: GroupSeries, f: Filters): number[] {
  const factor = salaryFactor(f);
  const result: number[] = [];
  for (const salary of g.weeklySalary) result.push(salary * factor);
  return result;
}

/** Số liệu tổng hợp của một nhóm nghề trong khung thời gian đang chọn */
export function groupStats(g: GroupSeries, f: Filters): Group {
  const factor = filterFactor(g, f);
  const jobs = Math.round(windowSum(g.weeklyJobs, f.weeks) * factor);
  const prev = Math.round(windowSum(g.weeklyJobs, f.weeks, f.weeks) * factor);
  const med = windowAverage(g.weeklySalary, f.weeks) * salaryFactor(f);
  return {
    id: g.id,
    name: g.name,
    jobs,
    prev,
    p25: med * g.p25Ratio,
    med,
    p75: med * g.p75Ratio,
    n: Math.round(jobs * g.disclosed), // số tin có công khai lương
  };
}

/** Lương trung vị kỳ trước (dùng để tính đà lương) */
export function groupPrevSalary(g: GroupSeries, f: Filters): number {
  return windowAverage(g.weeklySalary, f.weeks, f.weeks) * salaryFactor(f);
}

/** Các nhóm nghề thuộc một ngành */
export function seriesOfIndustry(ind: string): GroupSeries[] {
  return GROUP_SERIES.filter((g) => g.industry === ind);
}

/**
 * Có đủ tin để dự báo không: tính trên 12 tuần gần nhất (đúng khung mà dự báo dùng),
 * KHÔNG phụ thuộc khung 4/12/24 tuần đang xem. Dùng chung cho bảng xếp hạng và biểu đồ dự báo
 * để hai nơi không bao giờ nói ngược nhau.
 */
export function hasEnoughForForecast(g: GroupSeries, f: Filters): boolean {
  return windowSum(groupWeekly(g, f), FIT_WEEKS) >= MIN_SAMPLE;
}
