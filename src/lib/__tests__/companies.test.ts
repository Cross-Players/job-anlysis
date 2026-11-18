// Kiểm tra dữ liệu công ty và các hàm lọc công ty theo bộ lọc chung
import { expect, test } from 'vitest';
import { COMPANIES } from '@/data/companies';
import { companiesInFilters, companyInFilters } from '@/lib/cities';
import { buildJobs, buildPeerRows } from '@/lib/profile';
import { DEFAULT_FILTERS } from '@/lib/constants';
import type { Filters } from '@/lib/types';

function sumValues(obj: Record<string, number>) {
  let total = 0;
  for (const key in obj) total += obj[key];
  return total;
}

test('mỗi công ty có 48 tuần và tỷ trọng tổng bằng 1', () => {
  for (const c of COMPANIES) {
    expect(c.weekly.length).toBe(48);
    expect(sumValues(c.levelShare)).toBeCloseTo(1, 6);
    expect(sumValues(c.modeShare)).toBeCloseTo(1, 6);
  }
});

test('số tuần hiển thị theo bộ lọc thời gian', () => {
  const c = COMPANIES[0];
  expect(companyInFilters(c, DEFAULT_FILTERS).w.length).toBe(12);
  expect(companyInFilters(c, { ...DEFAULT_FILTERS, weeks: 4 }).w.length).toBe(4);
});

test('lọc Remote thì số tin không tăng', () => {
  for (const c of COMPANIES) {
    const all = companyInFilters(c, DEFAULT_FILTERS);
    const remote = companyInFilters(c, { ...DEFAULT_FILTERS, mode: 'remote' });
    expect(remote.j).toBeLessThanOrEqual(all.j);
  }
});

test('lọc Senior thì chỉ còn vị trí Senior', () => {
  const jobs = buildJobs(COMPANIES[0], { ...DEFAULT_FILTERS, level: 'senior' });
  expect(jobs.length).toBeGreaterThan(0);
  for (const j of jobs) expect(j.level).toBe('senior');
});

test('bộ lọc không khớp vị trí nào: danh sách rỗng, KPI không NaN', () => {
  const f: Filters = { ...DEFAULT_FILTERS, city: 'dn', level: 'intern', mode: 'remote' };
  for (const c of COMPANIES) {
    expect(buildJobs(c, f)).toEqual([]);
    const x = companyInFilters(c, f);
    for (const v of [x.j, x.p, x.g, x.open]) expect(Number.isFinite(v)).toBe(true);
    for (const row of buildPeerRows(c, f)) expect(Number.isFinite(row.ratio)).toBe(true);
  }
});

test('companiesInFilters bỏ công ty không còn tin nào', () => {
  const f: Filters = { ...DEFAULT_FILTERS, mode: 'remote' };
  for (const c of companiesInFilters(COMPANIES, f)) expect(c.j).toBeGreaterThan(0);
});
