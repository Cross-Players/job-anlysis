// Tính số liệu tổng hợp từ snapshot tin đang mở. Hàm thuần, không gọi mạng, để test được.
// Mọi con số đi kèm cỡ mẫu (n) để giao diện quyết định hiện số hay "Chưa đủ dữ liệu".
import type { Snapshot, SnapshotJob } from '@/api/snapshot';
import { CITIES, LEVELS, MIN_COMPANY_JOBS_FOR_STACK, MIN_TREND_WEEKS, NEWCOMER_LEVELS, SECTORS, WORK_MODES } from './constants';
import type { City, CityFilter, Filters, Level, SectorFilter, WorkMode } from './types';

export const sectorLabel = (sector: SectorFilter) => (sector === 'all' ? 'IT & Chuỗi cung ứng' : SECTORS.find((s) => s.key === sector)!.label);
export const cityLabel = (city: CityFilter) => (city === 'all' ? 'Cả 3 thành phố' : CITIES.find((c) => c.key === city)!.label);
export const levelLabel = (level: Level | null) => (level ? LEVELS.find((l) => l.key === level)!.label : 'Không ghi rõ');
export const modeLabel = (mode: WorkMode | null) => (mode ? WORK_MODES.find((m) => m.key === mode)!.label : null);

export interface SalaryStats { n: number; p25: number; med: number; p75: number }

/** Lương đại diện của một tin: điểm giữa khoảng công bố (hoặc số duy nhất có) */
export function salaryMid(j: Pick<SnapshotJob, 'salaryMin' | 'salaryMax'>): number | null {
  if (j.salaryMin !== null && j.salaryMax !== null) return (j.salaryMin + j.salaryMax) / 2;
  return j.salaryMin ?? j.salaryMax;
}

/** Phân vị có nội suy tuyến tính trên mảng đã sắp xếp tăng dần */
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function salaryStats(jobs: SnapshotJob[]): SalaryStats | null {
  const values = jobs.map(salaryMid).filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (values.length === 0) return null;
  return { n: values.length, p25: quantile(values, 0.25), med: quantile(values, 0.5), p75: quantile(values, 0.75) };
}

export function matchesFilters(j: SnapshotJob, f: Filters): boolean {
  if (f.sector !== 'all' && (j.sector ?? 'it') !== f.sector) return false;
  if (f.city !== 'all' && !j.cities.includes(f.city)) return false;
  if (f.level !== 'all' && j.level !== f.level) return false;
  if (f.mode !== 'all' && j.mode !== f.mode) return false;
  return true;
}

export const filterJobs = (jobs: SnapshotJob[], f: Filters) => jobs.filter((j) => matchesFilters(j, f));

const count = <T,>(items: T[]) => {
  const m = new Map<T, number>();
  for (const x of items) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
};

const pct = (part: number, total: number) => (total ? (part / total) * 100 : 0);

export interface Share { name: string; n: number; pct: number }

/** Kỹ năng được nhắc nhiều nhất: % tin có nhắc (một tin có thể nhắc nhiều kỹ năng) */
export function topSkills(jobs: SnapshotJob[], limit = 12): Share[] {
  const m = count(jobs.flatMap((j) => j.skills));
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, n]) => ({ name, n, pct: pct(n, jobs.length) }));
}

export interface GroupRow { id: string; name: string; n: number; salary: SalaryStats | null }

export interface OverviewData {
  n: number; // số tin đang mở khớp bộ lọc (và nhóm nghề nếu đang chọn)
  companies: number;
  salary: SalaryStats | null;
  disclosedPct: number; // % tin công khai lương
  groups: GroupRow[]; // cơ cấu nhóm nghề (không phụ thuộc nhóm đang chọn), lớn → nhỏ
  groupTotal: number;
  selected: { id: string; name: string } | null;
  skills: Share[];
  levels: { key: Level | null; label: string; n: number }[];
  levelKnown: number;
  newcomerPct: number; // % tin Intern/Fresher/Junior trong số tin ghi rõ cấp bậc
  topCompanies: { id: string; name: string; n: number }[];
}

export function computeOverview(snap: Snapshot, f: Filters, groupId: string | null): OverviewData {
  const base = filterJobs(snap.jobs, f);
  const groupName = (id: string) => snap.groups.find((g) => g.id === id)?.name ?? id;

  const byGroup = new Map<string, SnapshotJob[]>();
  for (const j of base) byGroup.set(j.group, [...(byGroup.get(j.group) ?? []), j]);
  const groups: GroupRow[] = [...byGroup.entries()]
    .map(([id, jobs]) => ({ id, name: groupName(id), n: jobs.length, salary: salaryStats(jobs) }))
    .sort((a, b) => b.n - a.n);

  // Nhóm đang chọn không còn tin với bộ lọc hiện tại thì coi như chưa chọn
  const selected = groupId && byGroup.has(groupId) ? { id: groupId, name: groupName(groupId) } : null;
  const jobs = selected ? byGroup.get(selected.id)! : base;

  const levelCounts = count(jobs.map((j) => j.level));
  const levels = [...LEVELS.map((l) => ({ key: l.key as Level | null, label: l.label, n: levelCounts.get(l.key) ?? 0 })), { key: null, label: 'Không ghi rõ', n: levelCounts.get(null) ?? 0 }];
  const levelKnown = jobs.length - (levelCounts.get(null) ?? 0);
  const newcomers = jobs.filter((j) => j.level && NEWCOMER_LEVELS.includes(j.level)).length;

  const byCompany = new Map<string, { id: string; name: string; n: number }>();
  for (const j of jobs) {
    const c = byCompany.get(j.companyId) ?? { id: j.companyId, name: j.company, n: 0 };
    c.n++;
    byCompany.set(j.companyId, c);
  }

  const salary = salaryStats(jobs);
  return {
    n: jobs.length,
    companies: byCompany.size,
    salary,
    disclosedPct: pct(salary?.n ?? 0, jobs.length),
    groups,
    groupTotal: base.length,
    selected,
    skills: topSkills(jobs),
    levels,
    levelKnown,
    newcomerPct: pct(newcomers, levelKnown),
    topCompanies: [...byCompany.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)).slice(0, 6),
  };
}

export interface CompanyRow {
  id: string;
  name: string;
  n: number; // tin đang mở khớp bộ lọc
  cities: City[];
  mainGroup: string;
  skills: string[];
  salaryN: number;
  salaryLo: number | null; // thấp nhất / cao nhất trong các khoảng lương công bố
  salaryHi: number | null;
  disclosedPct: number;
  latestPosted: string | null;
}

function salaryRange(jobs: SnapshotJob[]) {
  const withSalary = jobs.filter((j) => salaryMid(j) !== null);
  if (!withSalary.length) return { n: 0, lo: null, hi: null };
  const lows = withSalary.map((j) => j.salaryMin ?? j.salaryMax!);
  const highs = withSalary.map((j) => j.salaryMax ?? j.salaryMin!);
  return { n: withSalary.length, lo: Math.min(...lows), hi: Math.max(...highs) };
}

function toCompanyRow(snap: Snapshot, id: string, jobs: SnapshotJob[]): CompanyRow {
  const groupCounts = [...count(jobs.map((j) => j.group)).entries()].sort((a, b) => b[1] - a[1]);
  const cityCounts = count(jobs.flatMap((j) => j.cities));
  const range = salaryRange(jobs);
  const posted = jobs.map((j) => j.posted).filter((d): d is string => d !== null).sort();
  return {
    id,
    name: jobs[0].company,
    n: jobs.length,
    cities: CITIES.map((c) => c.key).filter((c) => cityCounts.has(c)),
    mainGroup: snap.groups.find((g) => g.id === groupCounts[0][0])?.name ?? groupCounts[0][0],
    skills: topSkills(jobs, 3).map((s) => s.name),
    salaryN: range.n,
    salaryLo: range.lo,
    salaryHi: range.hi,
    disclosedPct: pct(range.n, jobs.length),
    latestPosted: posted.length ? posted[posted.length - 1] : null,
  };
}

function groupByCompany(jobs: SnapshotJob[]) {
  const m = new Map<string, SnapshotJob[]>();
  for (const j of jobs) m.set(j.companyId, [...(m.get(j.companyId) ?? []), j]);
  return m;
}

/** Danh sách công ty có tin khớp bộ lọc; skill !== '' thì chỉ giữ công ty có tin nhắc kỹ năng đó */
export function companyRows(snap: Snapshot, f: Filters, skill = ''): CompanyRow[] {
  const rows: CompanyRow[] = [];
  for (const [id, jobs] of groupByCompany(filterJobs(snap.jobs, f))) {
    if (skill && !jobs.some((j) => j.skills.includes(skill))) continue;
    rows.push(toCompanyRow(snap, id, jobs));
  }
  return rows;
}

export interface CompanyDetail {
  row: CompanyRow | null; // null khi công ty không có tin khớp bộ lọc
  name: string;
  total: number; // tổng tin đang mở, chưa lọc
  jobs: SnapshotJob[]; // tin khớp bộ lọc, mới đăng trước
  stack: Share[] | null; // null khi quá ít tin để nói về stack
  salary: SalaryStats | null;
}

export function companyDetail(snap: Snapshot, id: string, f: Filters): CompanyDetail | null {
  const all = snap.jobs.filter((j) => j.companyId === id);
  if (!all.length) return null;
  const jobs = filterJobs(all, f).sort((a, b) => (b.posted ?? '').localeCompare(a.posted ?? '') || a.title.localeCompare(b.title));
  return {
    row: jobs.length ? toCompanyRow(snap, id, jobs) : null,
    name: all[0].company,
    total: all.length,
    jobs,
    stack: jobs.length >= MIN_COMPANY_JOBS_FOR_STACK ? topSkills(jobs, 10) : null,
    salary: salaryStats(jobs),
  };
}

/** Số tin ghi rõ hình thức làm việc (để quyết định có cho lọc theo hình thức không) */
export const modeCoverage = (snap: Snapshot) => snap.jobs.filter((j) => j.mode !== null).length;

/** Từ ngày bắt đầu thu thập, bao giờ đủ số tuần để hiện xu hướng */
export function trendReadiness(snap: Snapshot, today = new Date()) {
  if (!snap.trackingSince) return { since: null, weeks: 0, readyOn: null, ready: false };
  const since = new Date(`${snap.trackingSince}T00:00:00Z`);
  const weeks = Math.floor((today.getTime() - since.getTime()) / (7 * 86_400_000));
  const readyOn = new Date(since.getTime() + MIN_TREND_WEEKS * 7 * 86_400_000).toISOString().slice(0, 10);
  return { since: snap.trackingSince, weeks, readyOn, ready: weeks >= MIN_TREND_WEEKS };
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' */
export const viDate = (d: string | null) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '—');

/** Khoảng lương ngắn gọn: '25–35 tr', '20 tr' */
export function salaryText(lo: number | null, hi: number | null): string {
  const f = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  if (lo === null && hi === null) return 'Không công khai';
  if (lo !== null && hi !== null && lo !== hi) return `${f(lo)}–${f(hi)} tr`;
  return `${f((lo ?? hi)!)} tr`;
}
