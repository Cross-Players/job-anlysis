// Kiểm tra bảng xếp hạng "Nghề đáng đầu tư"
import { expect, test } from 'vitest';
import { explainRow, normalize, rankCareers } from '@/lib/ranking';
import { DEFAULT_FILTERS } from '@/lib/constants';
import type { Filters } from '@/lib/types';

test('normalize quy về 0–100, tất cả bằng nhau thì ra 50', () => {
  expect(normalize([1, 2, 3])).toEqual([0, 50, 100]);
  expect(normalize([5, 5])).toEqual([50, 50]);
  expect(normalize([])).toEqual([]);
});

test('xem tất cả ngành: 15 nghề, không có nhóm "Khác"', () => {
  const rows = rankCareers('all', DEFAULT_FILTERS);
  expect(rows.length).toBe(15);
  for (const r of rows) expect(r.id.endsWith('-khac')).toBe(false);
});

test('điểm giảm dần, nghề thiếu dữ liệu đứng cuối', () => {
  const rows = rankCareers('all', { ...DEFAULT_FILTERS, city: 'dn' });
  let seenNotEnough = false;
  let lastScore = Infinity;
  for (const r of rows) {
    if (!r.enoughData) {
      seenNotEnough = true;
      expect(r.score).toBeNull();
    } else {
      expect(seenNotEnough).toBe(false); // không có nghề đủ dữ liệu nào đứng sau nghề thiếu dữ liệu
      expect(r.score!).toBeLessThanOrEqual(lastScore);
      lastScore = r.score!;
    }
  }
});

test('Data đang lên, Mobile đang xuống', () => {
  const rows = rankCareers('it', DEFAULT_FILTERS);
  expect(rows.find((r) => r.id === 'it-data')!.direction).toBe('up');
  expect(rows.find((r) => r.id === 'it-mobile')!.direction).toBe('down');
});

test('% nhận người mới không đổi theo bộ lọc cấp bậc', () => {
  const all = rankCareers('it', DEFAULT_FILTERS).find((r) => r.id === 'it-web')!;
  const senior = rankCareers('it', { ...DEFAULT_FILTERS, level: 'senior' }).find((r) => r.id === 'it-web')!;
  expect(senior.newcomerPct).toBe(all.newcomerPct);
});

test('bộ lọc hẹp: không có NaN, nghề thiếu dữ liệu có điểm null', () => {
  const f: Filters = { ...DEFAULT_FILTERS, city: 'dn', level: 'intern', mode: 'remote' };
  for (const r of rankCareers('all', f)) {
    const numbers = [r.demandPct, r.salaryPct, r.companies, r.daysOpen, r.newcomerPct];
    if (r.score !== null) numbers.push(r.score);
    if (r.forecastPct !== null) numbers.push(r.forecastPct);
    for (const v of numbers) expect(Number.isFinite(v)).toBe(true);
    if (!r.enoughData) expect(r.score).toBeNull();
  }
});

test('câu giải thích có tên thành phố', () => {
  const f: Filters = { ...DEFAULT_FILTERS, city: 'hcm' };
  const row = rankCareers('it', f)[0];
  expect(explainRow(row, f)).toContain('TP.HCM');
});
