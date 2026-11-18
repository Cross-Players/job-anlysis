// Nhãn thành phố, hệ số theo thành phố, và hàm lọc số liệu công ty theo bộ lọc chung.
// Dữ liệu mẫu chỉ có số tổng nên lọc bằng cách nhân tỷ trọng; khi có backend thì backend trả số đã lọc.
import { CITIES, CITY_SALARY_FACTOR, CITY_SHARE } from '@/data/cities';
import { windowSum } from './series';
import type { CityFilter, Company, Filters } from './types';

/** Công ty có tỷ trọng tin ở thành phố dưới ngưỡng này thì bị ẩn khi lọc theo thành phố */
export const MIN_COMPANY_CITY_SHARE = 0.1;

export const cityLabel = (city: CityFilter) => (city === 'all' ? 'Cả 3 thành phố' : CITIES.find((c) => c.key === city)!.label);

/** Tỷ trọng tin của một ngành ở thành phố đang chọn ('all' = 1) */
export const industryCityShare = (ind: string, city: CityFilter) => (city === 'all' ? 1 : CITY_SHARE[ind][city]);

/** Hệ số lương của thành phố đang chọn ('all' = 1, mặt bằng chung) */
export const citySalaryFactor = (city: CityFilter) => (city === 'all' ? 1 : CITY_SALARY_FACTOR[city]);

/** Phần tin của công ty còn lại sau khi lọc thành phố, cấp bậc, hình thức (0–1) */
export function companyFactor(c: Company, f: Filters): number {
  const city = f.city === 'all' ? 1 : c.cityShare[f.city];
  const level = f.level === 'all' ? 1 : c.levelShare[f.level];
  const mode = f.mode === 'all' ? 1 : c.modeShare[f.mode];
  return city * level * mode;
}

/** Số liệu của công ty chỉ tính phần tin khớp bộ lọc, trong khung thời gian đang xem */
export function companyInFilters(c: Company, f: Filters): Company {
  const factor = companyFactor(c, f);

  const w: number[] = [];
  for (const jobs of c.weekly.slice(-f.weeks)) w.push(Math.round(jobs * factor));

  const j = Math.round(windowSum(c.weekly, f.weeks) * factor);
  const p = Math.round(windowSum(c.weekly, f.weeks, f.weeks) * factor);
  const g = p ? ((j - p) / p) * 100 : 0;
  // Tin đang mở ước bằng 1,6 lần số tin mới của 4 tuần gần nhất, không phụ thuộc khung thời gian
  const open = Math.round(windowSum(c.weekly, 4) * factor * 1.6);

  return { ...c, w, j, p, g, open, onsite: Math.round(c.modeShare.onsite * 100) };
}

/** Lọc công ty có hiện diện đủ ở thành phố đang chọn và còn tin sau khi lọc */
export function companiesInFilters(list: Company[], f: Filters): Company[] {
  const result: Company[] = [];
  for (const c of list) {
    if (f.city !== 'all' && c.cityShare[f.city] < MIN_COMPANY_CITY_SHARE) continue;
    const filtered = companyInFilters(c, f);
    if (filtered.j > 0) result.push(filtered);
  }
  return result;
}
