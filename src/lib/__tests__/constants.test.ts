// Kiểm tra các hằng số dùng chung cho bộ lọc
import { expect, test } from 'vitest';
import { DEFAULT_FILTERS, ESTIMATED_WEEKS, LEVELS, WORK_MODES } from '@/lib/constants';

test('có 6 cấp bậc và 3 hình thức làm việc', () => {
  expect(LEVELS.length).toBe(6);
  expect(WORK_MODES.length).toBe(3);
});

test('bộ lọc mặc định là 12 tuần', () => {
  expect(DEFAULT_FILTERS.weeks).toBe(12);
});

test('đoạn ước lượng dài đúng 12 tuần', () => {
  expect(ESTIMATED_WEEKS.to - ESTIMATED_WEEKS.from + 1).toBe(12);
});
