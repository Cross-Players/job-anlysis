// Thử MỌI tổ hợp bộ lọc trên mọi hàm API, đảm bảo không có số NaN / Infinity nào lọt ra giao diện.
// Đây là lưới an toàn khi sửa phần tính toán: bộ lọc hẹp nhất (ví dụ Đà Nẵng + Intern + Remote)
// dễ sinh ra phép chia cho 0.
import { expect, test } from 'vitest';
import { getCareerRanking, getCompanies, getCompany, getOverview, getTrend } from '@/api';
import { GROUP_SERIES } from '@/data/series';
import { LEVELS, WORK_MODES } from '@/lib/constants';
import type { CityFilter, Filters, Level, Weeks, WorkMode } from '@/lib/types';

/** Duyệt mọi giá trị bên trong một object, gom đường dẫn của các số NaN / Infinity */
function findBadNumbers(value: unknown, path: string, found: string[]): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) found.push(path);
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) findBadNumbers(value[i], `${path}[${i}]`, found);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) findBadNumbers((value as Record<string, unknown>)[key], `${path}.${key}`, found);
  }
}

function allFilters(): Filters[] {
  const weeksList: Weeks[] = [4, 12, 24];
  const cities: CityFilter[] = ['all', 'hn', 'dn', 'hcm'];
  const levels: (Level | 'all')[] = ['all', ...LEVELS.map((l) => l.key)];
  const modes: (WorkMode | 'all')[] = ['all', ...WORK_MODES.map((m) => m.key)];
  const result: Filters[] = [];
  for (const weeks of weeksList)
    for (const city of cities)
      for (const level of levels)
        for (const mode of modes) result.push({ weeks, city, level, mode });
  return result;
}

test('không có NaN / Infinity ở bất kỳ tổ hợp bộ lọc nào', async () => {
  const found: string[] = [];
  for (const f of allFilters()) {
    const tag = JSON.stringify(f);
    for (const ind of ['all', 'it', 'kt', 'mk']) {
      findBadNumbers(await getOverview(ind, null, f), `overview(${ind})${tag}`, found);
      findBadNumbers(await getCareerRanking(ind, f), `ranking(${ind})${tag}`, found);
    }
    findBadNumbers(await getOverview('it', 'it-data', f), `overview(it, it-data)${tag}`, found);
    findBadNumbers(await getCompanies(f), `companies${tag}`, found);
    findBadNumbers(await getCompany(0, f), `company(0)${tag}`, found);
    for (const g of GROUP_SERIES) {
      findBadNumbers(await getTrend(g.id, f, 'jobs'), `trend(${g.id}, jobs)${tag}`, found);
      findBadNumbers(await getTrend(g.id, f, 'salary'), `trend(${g.id}, salary)${tag}`, found);
    }
  }
  expect(found.slice(0, 10)).toEqual([]);
});

test('getTrend trả đúng độ dài lịch sử và đánh dấu tuần ước lượng', async () => {
  const f: Filters = { weeks: 24, city: 'all', level: 'all', mode: 'all' };
  const t = (await getTrend('it-data', f, 'jobs'))!;
  expect(t.history.length).toBe(24);
  expect(t.labels.length).toBe(24);
  // 12 tuần đầu của khung 24 tuần là ước lượng, 12 tuần sau là thật
  expect(t.estimated.slice(0, 12).every((x) => x)).toBe(true);
  expect(t.estimated.slice(12).some((x) => x)).toBe(false);
  expect(t.forecast!.points.length).toBe(12);
});

test('chế độ 4 tuần vẫn có dự báo (dự báo luôn dùng 12 tuần gần nhất)', async () => {
  const f: Filters = { weeks: 4, city: 'all', level: 'all', mode: 'all' };
  const t = (await getTrend('it-data', f, 'jobs'))!;
  expect(t.history.length).toBe(4);
  expect(t.forecast).not.toBeNull();
});

test('nhóm không tồn tại trả null', async () => {
  const f: Filters = { weeks: 12, city: 'all', level: 'all', mode: 'all' };
  expect(await getTrend('khong-co', f, 'jobs')).toBeNull();
  expect(await getCompany(999, f)).toBeNull();
});
