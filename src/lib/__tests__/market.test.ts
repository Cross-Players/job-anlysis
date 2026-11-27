import { describe, expect, test } from 'vitest';
import { companyDetail, companyRows, computeOverview, quantile, salaryMid, salaryStats, salaryText, topSkills, trendReadiness } from '@/lib/market';
import { DEFAULT_FILTERS } from '@/lib/constants';
import { makeJob, makeSnapshot } from '@/test/fixture';

describe('lương', () => {
  test('salaryMid lấy điểm giữa, hoặc số duy nhất có', () => {
    expect(salaryMid({ salaryMin: 20, salaryMax: 30 })).toBe(25);
    expect(salaryMid({ salaryMin: null, salaryMax: 30 })).toBe(30);
    expect(salaryMid({ salaryMin: null, salaryMax: null })).toBeNull();
  });

  test('quantile nội suy tuyến tính', () => {
    expect(quantile([10, 20, 30, 40], 0.5)).toBe(25);
    expect(quantile([10], 0.25)).toBe(10);
  });

  test('salaryStats bỏ tin không công khai lương, không có tin nào thì null', () => {
    const s = salaryStats([makeJob(1, { salaryMin: 10, salaryMax: 20 }), makeJob(2, { salaryMin: 30, salaryMax: 30 }), makeJob(3, { salaryMin: null, salaryMax: null })])!;
    expect(s.n).toBe(2);
    expect(s.med).toBe(22.5);
    expect(salaryStats([makeJob(3, { salaryMin: null, salaryMax: null })])).toBeNull();
  });

  test('salaryText', () => {
    expect(salaryText(25, 35)).toBe('25–35 tr');
    expect(salaryText(20, 20)).toBe('20 tr');
    expect(salaryText(null, null)).toBe('Không công khai');
  });
});

describe('computeOverview', () => {
  const snap = makeSnapshot();

  test('số tin, công ty, cơ cấu nhóm cộng đúng', () => {
    const d = computeOverview(snap, DEFAULT_FILTERS, null);
    expect(d.n).toBe(120);
    expect(d.companies).toBe(12);
    expect(d.groups.reduce((s, g) => s + g.n, 0)).toBe(d.groupTotal);
    expect(d.levels.reduce((s, l) => s + l.n, 0)).toBe(d.n);
    expect(d.salary!.n).toBe(80); // 2/3 số tin có lương
    expect(Math.round(d.disclosedPct)).toBe(67);
  });

  test('lọc thành phố: tin ở nhiều nơi được tính cho từng nơi', () => {
    const hn = computeOverview(snap, { ...DEFAULT_FILTERS, city: 'hn' }, null).n;
    const hcm = computeOverview(snap, { ...DEFAULT_FILTERS, city: 'hcm' }, null).n;
    const dn = computeOverview(snap, { ...DEFAULT_FILTERS, city: 'dn' }, null).n;
    expect(hn).toBe(48); // ['hn'] và ['hn','hcm']
    expect(hcm).toBe(72);
    expect(dn).toBe(24);
  });

  test('chọn nhóm nghề thu hẹp số liệu nhưng cơ cấu nhóm vẫn là toàn bộ', () => {
    const d = computeOverview(snap, DEFAULT_FILTERS, 'web');
    expect(d.selected?.id).toBe('web');
    expect(d.n).toBe(24);
    expect(d.groupTotal).toBe(120);
  });

  test('nhóm đang chọn không còn tin thì coi như chưa chọn', () => {
    const d = computeOverview(snap, DEFAULT_FILTERS, 'khong-co');
    expect(d.selected).toBeNull();
    expect(d.n).toBe(120);
  });

  test('tỷ lệ người mới chỉ tính trên tin ghi rõ cấp bậc', () => {
    const d = computeOverview(snap, DEFAULT_FILTERS, null);
    expect(d.levelKnown).toBe(90);
    expect(Math.round(d.newcomerPct)).toBe(50); // intern, fresher, junior / 6 cấp
  });
});

describe('công ty', () => {
  const snap = makeSnapshot();

  test('companyRows: mỗi công ty một dòng, lọc theo kỹ năng', () => {
    const rows = companyRows(snap, DEFAULT_FILTERS);
    expect(rows).toHaveLength(12);
    expect(rows.reduce((s, r) => s + r.n, 0)).toBe(120);
    const withPython = companyRows(snap, DEFAULT_FILTERS, 'Python');
    for (const r of withPython) expect(snap.jobs.some((j) => j.companyId === r.id && j.skills.includes('Python'))).toBe(true);
  });

  test('companyDetail: không có công ty thì null; có nhưng không khớp lọc thì row = null', () => {
    expect(companyDetail(snap, 'khong-co', DEFAULT_FILTERS)).toBeNull();
    const d = companyDetail(snap, 'cong-ty-3', { ...DEFAULT_FILTERS, city: 'dn', level: 'lead' })!;
    expect(d.total).toBe(10);
    expect(d.row).toBeNull();
    expect(d.jobs).toHaveLength(0);
  });

  test('companyDetail: dưới 3 tin thì chưa tổng hợp stack', () => {
    const small = { ...snap, jobs: [makeJob(1, { companyId: 'x' }), makeJob(2, { companyId: 'x' })] };
    expect(companyDetail(small, 'x', DEFAULT_FILTERS)!.stack).toBeNull();
    const three = { ...snap, jobs: [...small.jobs, makeJob(3, { companyId: 'x' })] };
    expect(companyDetail(three, 'x', DEFAULT_FILTERS)!.stack).not.toBeNull();
  });
});

test('topSkills: % trên số tin, sắp giảm dần', () => {
  const s = topSkills([makeJob(0, { skills: ['A', 'B'] }), makeJob(1, { skills: ['A'] })]);
  expect(s).toEqual([{ name: 'A', n: 2, pct: 100 }, { name: 'B', n: 1, pct: 50 }]);
});

test('lọc theo ngành (sector) và hình thức làm việc (mode: onsite, hybrid, remote)', () => {
  const snap = makeSnapshot(0);
  snap.jobs = [
    makeJob(1, { sector: 'it', mode: 'remote' }),
    makeJob(2, { sector: 'it', mode: 'hybrid' }),
    makeJob(3, { sector: 'scm', mode: 'onsite' }),
    makeJob(4, { sector: 'scm', mode: null }),
  ];
  expect(computeOverview(snap, { ...DEFAULT_FILTERS, sector: 'scm' }, null).n).toBe(2);
  expect(computeOverview(snap, { ...DEFAULT_FILTERS, sector: 'it' }, null).n).toBe(2);
  expect(computeOverview(snap, { ...DEFAULT_FILTERS, mode: 'remote' }, null).n).toBe(1);
  expect(computeOverview(snap, { ...DEFAULT_FILTERS, mode: 'hybrid' }, null).n).toBe(1);
  expect(computeOverview(snap, { ...DEFAULT_FILTERS, mode: 'onsite' }, null).n).toBe(1);
});

test('trendReadiness: đủ 8 tuần mới sẵn sàng', () => {
  const snap = makeSnapshot(1);
  expect(trendReadiness(snap, new Date('2026-12-01T00:00:00Z'))).toMatchObject({ weeks: 1, ready: false, readyOn: '2027-01-17' });
  expect(trendReadiness(snap, new Date('2027-01-17T00:00:00Z')).ready).toBe(true);
  expect(trendReadiness({ ...snap, trackingSince: null }).ready).toBe(false);
});
