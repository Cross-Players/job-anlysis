// Tầng dữ liệu cho giao diện. Mọi trang lấy số liệu qua các hàm ở đây, không import thẳng src/data.
// Hiện các hàm đọc dữ liệu mẫu và tính ngay trong trình duyệt.
// Khi có backend Python: thay ruột từng hàm bằng fetch tới API, giữ nguyên kiểu trả về.
// Các hàm trả về Promise (giống gọi API thật) để lúc đổi sang fetch giao diện không phải sửa.
import { COMPANIES } from '@/data/companies';
import { GROUP_SERIES, skillSeriesOfGroup } from '@/data/series';
import { IND } from '@/data/overview';
import { ESTIMATED_WEEKS, TOTAL_WEEKS } from '@/lib/constants';
import { companiesInFilters, companyInFilters, MIN_COMPANY_CITY_SHARE } from '@/lib/cities';
import { forecastSeries } from '@/lib/forecast';
import { computeOverview } from '@/lib/overview';
import { buildJobs, buildPeerRows } from '@/lib/profile';
import { rankCareers } from '@/lib/ranking';
import { groupWeekly, groupWeeklySalary, hasEnoughForForecast, windowAverage } from '@/lib/series';
import { weekLabels } from '@/lib/stats';
import type { Company, Filters } from '@/lib/types';
import type { CareerRow, CompanyDetail, OverviewData, SkillTrend, TrendDetail, TrendMetric } from './types';

export function getOverview(ind: string, sel: string | null, f: Filters): Promise<OverviewData> {
  return Promise.resolve(computeOverview(ind, sel, f));
}

export function getCompanies(f: Filters): Promise<Company[]> {
  return Promise.resolve(companiesInFilters(COMPANIES, f));
}

export function getCompany(id: number, f: Filters): Promise<CompanyDetail | null> {
  const base = COMPANIES.find((c) => c.id === id);
  if (!base) return Promise.resolve(null);
  const thin = f.city !== 'all' && base.cityShare[f.city] < MIN_COMPANY_CITY_SHARE;
  return Promise.resolve({
    company: companyInFilters(base, f),
    peerRows: buildPeerRows(base, f),
    jobs: buildJobs(base, f),
    thin,
  });
}

export function getCareerRanking(ind: string, f: Filters): Promise<CareerRow[]> {
  return Promise.resolve(rankCareers(ind, f));
}

/** Tỷ trọng hiện tại và hướng đi của từng kỹ năng trong nhóm nghề */
function buildSkillTrends(groupId: string, f: Filters): SkillTrend[] {
  const result: SkillTrend[] = [];
  for (const skill of skillSeriesOfGroup(groupId)) {
    const forecast = forecastSeries(skill.weekly);
    result.push({
      name: skill.name,
      sharePct: Math.round(windowAverage(skill.weekly, f.weeks)),
      direction: forecast ? forecast.direction : 'flat',
    });
  }
  return result;
}

export function getTrend(groupId: string, f: Filters, metric: TrendMetric): Promise<TrendDetail | null> {
  const g = GROUP_SERIES.find((x) => x.id === groupId);
  if (!g) return Promise.resolve(null);

  const full = metric === 'jobs' ? groupWeekly(g, f) : groupWeeklySalary(g, f);
  const history = full.slice(full.length - f.weeks);

  // Đánh dấu tuần ước lượng theo vị trí gốc trong mảng 48 tuần
  const estimated: boolean[] = [];
  for (let i = 0; i < history.length; i++) {
    const original = TOTAL_WEEKS - f.weeks + i;
    estimated.push(original >= ESTIMATED_WEEKS.from && original <= ESTIMATED_WEEKS.to);
  }

  // Đủ dữ liệu hay không tính trên 12 tuần gần nhất (giống bảng xếp hạng), không theo khung đang xem.
  // Dự báo cũng luôn dùng 12 tuần gần nhất của chuỗi đầy đủ.
  const enoughData = hasEnoughForForecast(g, f);
  const forecast = enoughData ? forecastSeries(full) : null;

  return Promise.resolve({
    group: { id: g.id, name: g.name, industryName: IND[g.industry].name },
    labels: weekLabels(f.weeks),
    history,
    estimated,
    forecast,
    enoughData,
    skills: buildSkillTrends(g.id, f),
  });
}
