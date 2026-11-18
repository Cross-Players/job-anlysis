// Các phép tính dùng chung: tổng, % thay đổi, nhãn tuần, gom nhóm nghề theo ngành, nhãn đà tuyển.
// Mọi hàm nhận bộ lọc `Filters` để số liệu khớp thời gian / thành phố / cấp bậc / hình thức đang chọn.
import { GROUP_SERIES } from '@/data/series';
import { IND, INDUSTRY_KEYS } from '@/data/overview';
import { groupStats, groupWeekly, seriesOfIndustry } from './series';
import type { Company, Filters, Group, GroupSeries } from './types';

export const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
export const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);

/** Ngày bắt đầu của tuần mới nhất trong dữ liệu mẫu */
const LAST_WEEK = new Date(2026, 10, 2); // 2/11/2026 (tháng tính từ 0)

/** Nhãn ngày cho `weeks` tuần gần nhất, ví dụ [..., '26/10', '2/11'] */
export function weekLabels(weeks: number): string[] {
  const labels: string[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(LAST_WEEK);
    d.setDate(d.getDate() - i * 7);
    labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
  }
  return labels;
}

/**
 * Gộp nhiều nhóm nghề thành một dòng (dùng khi xem tất cả ngành: mỗi ngành là một dòng).
 * Lương lấy trung bình có trọng số theo số tin có lương (n), để nhóm đông tin ảnh hưởng nhiều hơn.
 */
export function mergeGroups(id: string, name: string, groups: Group[]): Group {
  let jobs = 0;
  let prev = 0;
  let n = 0;
  let p25 = 0;
  let med = 0;
  let p75 = 0;
  for (const g of groups) {
    jobs += g.jobs;
    prev += g.prev;
    n += g.n;
    p25 += g.p25 * g.n;
    med += g.med * g.n;
    p75 += g.p75 * g.n;
  }
  if (n === 0) return { id, name, jobs, prev, p25: 0, med: 0, p75: 0, n };
  return { id, name, jobs, prev, p25: p25 / n, med: med / n, p75: p75 / n, n };
}

/** Các dòng hiển thị: mỗi ngành (khi ind = 'all') hoặc mỗi nhóm nghề trong một ngành */
export function getGroups(ind: string, f: Filters): Group[] {
  if (ind === 'all') {
    const rows: Group[] = [];
    for (const key of INDUSTRY_KEYS) {
      const groups = seriesOfIndustry(key).map((g) => groupStats(g, f));
      rows.push(mergeGroups(key, IND[key].name, groups));
    }
    return rows;
  }
  return seriesOfIndustry(ind).map((g) => groupStats(g, f));
}

/** Cộng số tin theo tuần của nhiều nhóm nghề, trả về kỳ này và kỳ trước (mỗi kỳ dài f.weeks tuần) */
export function seriesOfGroups(list: GroupSeries[], f: Filters): { cur: number[]; prev: number[] } {
  const total = new Array(48).fill(0);
  for (const g of list) {
    const weekly = groupWeekly(g, f);
    for (let i = 0; i < weekly.length; i++) total[i] += weekly[i];
  }
  const cur = total.slice(total.length - f.weeks);
  const prev = total.slice(total.length - 2 * f.weeks, total.length - f.weeks);
  return { cur, prev };
}

/** Chuỗi theo tuần của một ngành hoặc của tất cả ngành */
export function getSeries(ind: string, f: Filters): { cur: number[]; prev: number[] } {
  const list = ind === 'all' ? GROUP_SERIES : seriesOfIndustry(ind);
  return seriesOfGroups(list, f);
}

export type StatusTone = 'a' | 's' | 'c' | 'n';

/** Nhãn đà tuyển dụng. Ngưỡng là giá trị demo, cần chỉnh khi có dữ liệu thật. */
export function companyStatus(c: Company): { label: string; tone: StatusTone } {
  if (c.j < 6) return { label: 'Chưa đủ dữ liệu', tone: 'n' };
  if (c.g >= 25) return { label: 'Tăng tốc', tone: 'a' };
  if (c.g <= -10) return { label: 'Chậm lại', tone: 'c' };
  return { label: 'Ổn định', tone: 's' };
}
