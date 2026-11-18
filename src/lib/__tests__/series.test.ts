// Kiểm tra dữ liệu mẫu 48 tuần và các hàm lọc theo nhóm nghề
import { expect, test } from 'vitest';
import { GROUP_SERIES } from '@/data/series';
import { groupStats, groupWeekly, seriesOfIndustry, windowSum } from '@/lib/series';
import { DEFAULT_FILTERS } from '@/lib/constants';

function findGroup(id: string) {
  const g = GROUP_SERIES.find((x) => x.id === id);
  if (!g) throw new Error('Không có nhóm ' + id);
  return g;
}

function sumValues(obj: Record<string, number>) {
  let total = 0;
  for (const key in obj) total += obj[key];
  return total;
}

test('có 18 nhóm, id không trùng, mỗi nhóm 48 tuần', () => {
  expect(GROUP_SERIES.length).toBe(18);
  const ids = new Set(GROUP_SERIES.map((g) => g.id));
  expect(ids.size).toBe(18);
  for (const g of GROUP_SERIES) {
    expect(g.weeklyJobs.length).toBe(48);
    expect(g.weeklySalary.length).toBe(48);
  }
});

test('tỷ trọng cấp bậc và hình thức mỗi nhóm có tổng bằng 1', () => {
  for (const g of GROUP_SERIES) {
    expect(sumValues(g.levelShare)).toBeCloseTo(1, 6);
    expect(sumValues(g.modeShare)).toBeCloseTo(1, 6);
  }
});

test('đúng 3 nhóm "Khác"', () => {
  expect(GROUP_SERIES.filter((g) => g.isOther).length).toBe(3);
});

test('windowSum cộng đúng khung tuần', () => {
  expect(windowSum([1, 2, 3, 4, 5], 2)).toBe(9);
  expect(windowSum([1, 2, 3, 4, 5], 2, 2)).toBe(5);
});

test('nhóm Data (IT) đang tăng: kỳ này nhiều tin hơn kỳ trước', () => {
  const s = groupStats(findGroup('it-data'), DEFAULT_FILTERS);
  expect(s.jobs).toBeGreaterThan(s.prev);
});

test('bộ lọc hẹp vẫn ra số hợp lệ', () => {
  const f = { ...DEFAULT_FILTERS, city: 'dn' as const, level: 'intern' as const, mode: 'remote' as const };
  for (const g of GROUP_SERIES) {
    const s = groupStats(g, f);
    expect(s.jobs).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(s.med)).toBe(true);
  }
});

test('groupWeekly trả 48 tuần, lọc thì số tin giảm', () => {
  const g = findGroup('it-web');
  const all = groupWeekly(g, DEFAULT_FILTERS);
  const remote = groupWeekly(g, { ...DEFAULT_FILTERS, mode: 'remote' });
  expect(all.length).toBe(48);
  expect(windowSum(remote, 12)).toBeLessThan(windowSum(all, 12));
});

test('seriesOfIndustry trả 6 nhóm của ngành', () => {
  expect(seriesOfIndustry('kt').length).toBe(6);
});
