// Kiểm tra phần tính số liệu cho trang Tổng quan trên bộ dữ liệu 48 tuần
import { expect, test } from 'vitest';
import { getGroups, getSeries, weekLabels } from '@/lib/stats';
import { computeOverview } from '@/lib/overview';
import { DEFAULT_FILTERS } from '@/lib/constants';

test('xem tất cả ngành có 3 nhóm, xem IT có 6 nhóm', () => {
  expect(getGroups('all', DEFAULT_FILTERS).length).toBe(3);
  expect(getGroups('it', DEFAULT_FILTERS).length).toBe(6);
});

test('tổng tin các nhóm IT bằng tin của ngành IT khi xem tất cả', () => {
  let itTotal = 0;
  for (const g of getGroups('it', DEFAULT_FILTERS)) itTotal += g.jobs;
  const itAsIndustry = getGroups('all', DEFAULT_FILTERS).find((g) => g.id === 'it')!;
  expect(itAsIndustry.jobs).toBe(itTotal);
});

test('chuỗi theo tuần dài đúng bằng khung thời gian', () => {
  const s = getSeries('it', { ...DEFAULT_FILTERS, weeks: 24 });
  expect(s.cur.length).toBe(24);
  expect(s.prev.length).toBe(24);
});

test('nhóm đang chọn không còn tồn tại thì coi như chưa chọn', () => {
  expect(computeOverview('it', 'khong-ton-tai', DEFAULT_FILTERS).S).toBeNull();
});

test('nhãn tuần cuối là 2/11', () => {
  const labels = weekLabels(12);
  expect(labels.length).toBe(12);
  expect(labels[labels.length - 1]).toBe('2/11');
});
