// Số liệu cho trang hồ sơ công ty: lương so với nhóm tương đương và danh sách vị trí đang mở.
// Cả hai là dữ liệu mô phỏng, chạy theo bộ lọc chung (thành phố, cấp bậc, hình thức).
import { PEER } from '@/data/companies';
import { CITY_SALARY_FACTOR } from '@/data/cities';
import { LEVEL_SALARY_FACTOR } from './constants';
import { MIN_COMPANY_CITY_SHARE } from './cities';
import { salaryFactor } from './series';
import type { City, Company, Filters, Level, WorkMode } from './types';

export interface PeerRow { role: string; mine: number; peer: number; n: number; ratio: number }
export interface OpenJob { title: string; level: Level; city: City; mode: WorkMode; salary: number }

/** So lương từng vị trí của công ty với trung vị nhóm tương đương (cùng thành phố, cùng cấp bậc) */
export function buildPeerRows(c: Company, f: Filters): PeerRow[] {
  const factor = salaryFactor(f);
  const share = f.city === 'all' ? 1 : c.cityShare[f.city];
  const rows: PeerRow[] = [];
  const roles = Object.keys(PEER);
  for (let i = 0; i < roles.length; i++) {
    const role = roles[i];
    const peer = Math.round(PEER[role] * factor);
    const mine = Math.round(PEER[role] * factor * c.ratio * (1 + Math.sin(i + c.id) * 0.06));
    const n = Math.round((8 + ((c.id * 7 + i * 5) % 40)) * share);
    rows.push({ role, mine, peer, n, ratio: peer ? mine / peer : 1 });
  }
  return rows;
}

// Các vị trí mẫu: [chức danh, cấp bậc, thành phố]
const SAMPLE: [string, Level, City][] = [
  ['Backend Dev', 'senior', 'hn'], ['BA', 'middle', 'hn'],
  ['Frontend Dev', 'middle', 'hcm'], ['QA', 'junior', 'hcm'], ['Backend Dev', 'middle', 'hcm'],
  ['Data Engineer', 'senior', 'dn'], ['QA', 'middle', 'dn'],
];

// Gán hình thức làm việc cố định cho từng vị trí, sao cho tỷ lệ Onsite gần với % onsite của công ty
function pickMode(index: number, c: Company): WorkMode {
  if ((index * 37 + c.id * 13) % 100 < c.onsite) return 'onsite';
  return index % 2 ? 'hybrid' : 'remote';
}

/** Vị trí đang mở, ở nơi công ty có đủ tin, và khớp bộ lọc thành phố / cấp bậc / hình thức */
export function buildJobs(c: Company, f: Filters): OpenJob[] {
  const jobs: OpenJob[] = [];
  for (let i = 0; i < SAMPLE.length; i++) {
    const [title, level, city] = SAMPLE[i];
    const mode = pickMode(i, c);

    if (c.cityShare[city] < MIN_COMPANY_CITY_SHARE) continue;
    if (f.city !== 'all' && city !== f.city) continue;
    if (f.level !== 'all' && level !== f.level) continue;
    if (f.mode !== 'all' && mode !== f.mode) continue;

    const salary = Math.round(PEER[title] * c.ratio * CITY_SALARY_FACTOR[city] * LEVEL_SALARY_FACTOR[level]);
    jobs.push({ title, level, city, mode, salary });
  }
  return jobs;
}
