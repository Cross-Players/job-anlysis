// Bảng xếp hạng "Nghề đáng đầu tư" cho sinh viên / người tìm việc.
// Mỗi nghề có 5 tiêu chí, quy về thang 0–100 so với các nghề khác trong bảng, rồi cộng theo trọng số.
// Trọng số đặt ở WEIGHTS để dễ chỉnh. Độ khó tuyển (số ngày tin mở) chỉ hiển thị, không tính điểm.
import { GROUP_SERIES } from '@/data/series';
import { IND } from '@/data/overview';
import { MIN_SAMPLE, NEWCOMER_LEVELS } from './constants';
import { forecastSeries, type Direction } from './forecast';
import { filterFactor, groupPrevSalary, groupStats, groupWeekly, hasEnoughForForecast } from './series';
import { cityLabel } from './cities';
import type { Filters, GroupSeries } from './types';

export const WEIGHTS = { newcomer: 0.3, demand: 0.25, forecast: 0.2, salary: 0.15, breadth: 0.1 };

export interface CareerRow {
  id: string;
  name: string;
  industry: string;
  industryName: string;
  enoughData: boolean; // số tin >= MIN_SAMPLE
  score: number | null; // 0–100, null nếu thiếu dữ liệu
  demandPct: number; // số tin kỳ này so với kỳ trước, %
  salaryPct: number; // lương trung vị kỳ này so với kỳ trước, %
  companies: number; // số công ty đang tuyển (theo thành phố đang chọn)
  daysOpen: number; // số ngày trung bình tin còn mở
  newcomerPct: number; // % tin nhận Intern / Fresher / Junior (không theo bộ lọc cấp bậc)
  forecastPct: number | null; // dự báo số tin 12 tuần tới so với 12 tuần qua, %
  direction: Direction | null;
  sentence: string;
}

/** Quy một dãy số về thang 0–100 (nhỏ nhất = 0, lớn nhất = 100). Tất cả bằng nhau thì ra 50. */
export function normalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const result: number[] = [];
  for (const v of values) {
    if (max === min) result.push(50);
    else result.push(((v - min) / (max - min)) * 100);
  }
  return result;
}

function percentChange(now: number, before: number): number {
  if (before === 0) return 0;
  return ((now - before) / before) * 100;
}

/** Một dòng chưa có điểm và câu giải thích */
function buildRow(g: GroupSeries, f: Filters): CareerRow {
  const stats = groupStats(g, f);
  // Không đủ tin trong 12 tuần gần nhất thì không dự báo, để không gắn nhãn hướng đi cho 0 tin
  const forecast = hasEnoughForForecast(g, f) ? forecastSeries(groupWeekly(g, f)) : null;
  // Số công ty chỉ phụ thuộc thành phố, không phụ thuộc cấp bậc hay hình thức
  const cityOnly: Filters = { ...f, level: 'all', mode: 'all' };

  let newcomerShare = 0;
  for (const level of NEWCOMER_LEVELS) newcomerShare += g.levelShare[level];

  return {
    id: g.id,
    name: g.name,
    industry: g.industry,
    industryName: IND[g.industry].name,
    enoughData: stats.jobs >= MIN_SAMPLE,
    score: null,
    demandPct: percentChange(stats.jobs, stats.prev),
    salaryPct: percentChange(stats.med, groupPrevSalary(g, f)),
    companies: Math.round(g.companies * filterFactor(g, cityOnly)),
    daysOpen: g.daysOpen,
    newcomerPct: Math.round(newcomerShare * 100),
    forecastPct: forecast ? forecast.changePct : null,
    direction: forecast ? forecast.direction : null,
    sentence: '',
  };
}

/** Chấm điểm cho các dòng đủ dữ liệu (sửa trực tiếp trường score) */
function scoreRows(rows: CareerRow[]): void {
  const newcomer = normalize(rows.map((r) => r.newcomerPct));
  const demand = normalize(rows.map((r) => r.demandPct));
  const forecast = normalize(rows.map((r) => r.forecastPct ?? 0));
  const salary = normalize(rows.map((r) => r.salaryPct));
  const breadth = normalize(rows.map((r) => r.companies));

  for (let i = 0; i < rows.length; i++) {
    const score =
      newcomer[i] * WEIGHTS.newcomer +
      demand[i] * WEIGHTS.demand +
      forecast[i] * WEIGHTS.forecast +
      salary[i] * WEIGHTS.salary +
      breadth[i] * WEIGHTS.breadth;
    rows[i].score = Math.round(score);
  }
}

const DIRECTION_TEXT: Record<Direction, string> = { up: 'đang lên', flat: 'đi ngang', down: 'đang xuống' };

/** Câu giải thích ngắn sinh từ số liệu của một dòng */
export function explainRow(row: CareerRow, f: Filters): string {
  const place = cityLabel(f.city);
  if (!row.enoughData) {
    if (!row.direction) return `${row.name} · ${place}: chưa đủ dữ liệu để đánh giá.`;
    // Khung đang xem ít tin nên chưa chấm điểm, nhưng 12 tuần gần nhất đủ tin để dự báo
    return `${row.name} · ${place}: chưa đủ tin trong ${f.weeks} tuần để chấm điểm, dự báo ${DIRECTION_TEXT[row.direction]}.`;
  }
  const sign = row.demandPct >= 0 ? '+' : '';
  const demand = `${sign}${row.demandPct.toFixed(0)}%`;
  const direction = row.direction ? DIRECTION_TEXT[row.direction] : 'chưa rõ';
  return `${row.name} · ${place}: nhu cầu ${demand}, ${row.newcomerPct}% tin nhận người mới, dự báo ${direction}.`;
}

/** Xếp hạng các nghề trong một ngành (hoặc 'all' = mọi ngành). Bỏ qua nhóm "Khác". */
export function rankCareers(ind: string, f: Filters): CareerRow[] {
  const enough: CareerRow[] = [];
  const notEnough: CareerRow[] = [];

  for (const g of GROUP_SERIES) {
    if (g.isOther) continue;
    if (ind !== 'all' && g.industry !== ind) continue;
    const row = buildRow(g, f);
    if (row.enoughData) enough.push(row);
    else notEnough.push(row);
  }

  // Chỉ so sánh giữa các nghề đủ dữ liệu, để nghề ít tin không kéo lệch thang điểm
  scoreRows(enough);
  enough.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const rows = [...enough, ...notEnough];
  for (const row of rows) row.sentence = explainRow(row, f);
  return rows;
}
