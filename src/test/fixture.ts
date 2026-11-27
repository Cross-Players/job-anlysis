// Snapshot giả dùng cho test: đủ đa dạng để chạm mọi nhánh (thiếu lương, thiếu cấp bậc, nhiều thành phố, mẫu nhỏ).
import type { Snapshot, SnapshotJob } from '@/api/snapshot';
import type { City, Level } from '@/lib/types';

const GROUPS = ['web', 'data', 'infra', 'qa', 'other'];
const LEVELS: (Level | null)[] = ['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', null, null];
const CITY_SETS: City[][] = [['hn'], ['hcm'], ['hcm'], ['dn'], ['hn', 'hcm']];
const SKILLS = ['Java', 'React', 'SQL', 'Docker', 'Python'];

export function makeJob(i: number, over: Partial<SnapshotJob> = {}): SnapshotJob {
  const hasSalary = i % 3 !== 0;
  return {
    id: `t:${i}`,
    source: 'vieclam24h',
    url: `https://example.com/${i}`,
    title: `Vị trí ${i}`,
    company: `Công ty ${i % 12}`,
    companyId: `cong-ty-${i % 12}`,
    cities: CITY_SETS[i % CITY_SETS.length],
    posted: `2026-11-${String((i % 20) + 1).padStart(2, '0')}`,
    firstSeen: '2026-11-22',
    sector: 'it',
    group: GROUPS[i % GROUPS.length],
    level: LEVELS[i % LEVELS.length],
    mode: null,
    skills: SKILLS.filter((_, k) => (i + k) % 3 === 0),
    salaryMin: hasSalary ? 10 + (i % 15) : null,
    salaryMax: hasSalary ? 20 + (i % 15) : null,
    ...over,
  };
}

export function makeSnapshot(n = 120): Snapshot {
  return {
    version: 1,
    generatedAt: '2026-11-22T12:00:00.000Z',
    trackingSince: '2026-11-22',
    groups: GROUPS.map((id) => ({ id, name: id.toUpperCase() })),
    sources: [{ name: 'vieclam24h', status: 'ok', lastRunAt: '2026-11-22T11:40:00.000Z', listed: 286, open: 280 }],
    excluded: { outOfScope: 40, notIt: 20 },
    jobs: Array.from({ length: n }, (_, i) => makeJob(i)),
  };
}
