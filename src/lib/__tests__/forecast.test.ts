// Kiểm tra hàm dự báo: đường xu hướng, vùng không chắc chắn, nhãn hướng đi, backtest
import { expect, test } from 'vitest';
import { backtestErrorPct, forecastSeries, linearFit, residualStd } from '@/lib/forecast';

// 12 tuần, mỗi tuần tăng đúng 2 tin: 10, 12, ..., 32
const rising: number[] = [];
for (let i = 0; i < 12; i++) rising.push(10 + i * 2);

// Chuỗi có nhiễu để vùng mờ có độ rộng
const noisy = [20, 24, 19, 25, 21, 26, 22, 27, 23, 28, 24, 29];

function hasBadNumber(values: number[]) {
  for (const v of values) if (!Number.isFinite(v)) return true;
  return false;
}

test('linearFit tìm đúng độ dốc và điểm cắt', () => {
  const fit = linearFit([1, 2, 3, 4]);
  expect(fit.slope).toBeCloseTo(1);
  expect(fit.intercept).toBeCloseTo(1);
});

test('dưới 8 tuần thì không dự báo', () => {
  expect(forecastSeries([1, 2, 3, 4, 5, 6, 7])).toBeNull();
});

test('chuỗi tăng đều: hướng lên, tuần tới = 34, chắc chắn cao', () => {
  const r = forecastSeries(rising)!;
  expect(r.points.length).toBe(12);
  expect(r.points[0].mid).toBeCloseTo(34);
  expect(r.direction).toBe('up');
  expect(r.confidence).toBe('high');
  const fit = linearFit(rising);
  expect(residualStd(rising, fit.slope, fit.intercept)).toBeCloseTo(0);
});

test('chuỗi phẳng: đi ngang, thay đổi 0%', () => {
  const flat = new Array(12).fill(20);
  const r = forecastSeries(flat)!;
  expect(r.direction).toBe('flat');
  expect(r.changePct).toBe(0);
});

test('chuỗi toàn 0: không có NaN, đi ngang, chắc chắn thấp', () => {
  const zeros = new Array(12).fill(0);
  const r = forecastSeries(zeros)!;
  expect(r.direction).toBe('flat');
  expect(r.confidence).toBe('low');
  expect(Number.isFinite(r.changePct)).toBe(true);
  for (const p of r.points) expect(hasBadNumber([p.mid, p.lo, p.hi])).toBe(false);
});

test('chuỗi giảm: hướng xuống, cận dưới không âm', () => {
  const falling: number[] = [];
  for (let i = 0; i < 12; i++) falling.push(40 - i * 3);
  const r = forecastSeries(falling)!;
  expect(r.direction).toBe('down');
  for (const p of r.points) expect(p.lo).toBeGreaterThanOrEqual(0);
});

test('vùng mờ rộng dần theo thời gian', () => {
  const r = forecastSeries(noisy)!;
  const first = r.points[0].hi - r.points[0].mid;
  const last = r.points[11].hi - r.points[11].mid;
  expect(last).toBeGreaterThan(first);
});

test('backtest: chuỗi thẳng sai gần 0%, chuỗi quá ngắn trả null', () => {
  const long: number[] = [];
  for (let i = 0; i < 16; i++) long.push(10 + i);
  expect(backtestErrorPct(long)!).toBeCloseTo(0);
  expect(backtestErrorPct([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBeNull();
});
