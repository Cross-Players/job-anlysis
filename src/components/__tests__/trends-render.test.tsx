// Render các khối của trang Xu hướng ra HTML với mọi tổ hợp bộ lọc:
// không có NaN, có đủ chữ "Dự báo" / nhãn hướng đi, và nghề thiếu dữ liệu hiện "Chưa đủ dữ liệu".
import { expect, test, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { getCareerRanking, getTrend } from '@/api';
import { DEFAULT_FILTERS, LEVELS, WORK_MODES } from '@/lib/constants';
import type { CityFilter, Filters, Level, Weeks, WorkMode } from '@/lib/types';
import { CareerTable } from '@/components/trends/CareerTable';
import { TrendDetail } from '@/components/trends/TrendDetail';
import { SkillTrends } from '@/components/trends/SkillTrends';

vi.spyOn(console, 'warn').mockImplementation(() => {});

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

async function renderTrendsPage(ind: string, f: Filters, metric: 'jobs' | 'salary'): Promise<string> {
  const rows = await getCareerRanking(ind, f);
  let html = renderToString(
    <CareerTable rows={rows} showIndustry={ind === 'all'} selectedId={rows[0]?.id ?? null} onSelect={() => {}} sortKey="score" desc onSort={() => {}} />,
  );
  if (rows.length) {
    const detail = (await getTrend(rows[0].id, f, metric))!;
    html += renderToString(
      <>
        <TrendDetail detail={detail} row={rows[0]} metric={metric} onMetric={() => {}} />
        <SkillTrends skills={detail.skills} groupName={detail.group.name} enoughData={detail.enoughData} />
      </>,
    );
  }
  // React chèn <!-- --> giữa chữ và biểu thức khi render; bỏ đi để so chuỗi dễ hơn
  return html.replace(/<!-- -->/g, '');
}

test('trang Xu hướng không hiện NaN ở mọi tổ hợp bộ lọc', async () => {
  const bad: string[] = [];
  for (const f of allFilters()) {
    for (const ind of ['all', 'it', 'kt', 'mk']) {
      for (const metric of ['jobs', 'salary'] as const) {
        const html = await renderTrendsPage(ind, f, metric);
        if (html.includes('NaN') || html.includes('Infinity')) bad.push(`${ind} ${metric} ${JSON.stringify(f)}`);
      }
    }
  }
  expect(bad.slice(0, 5)).toEqual([]);
});

test('mặc định: có nhãn Dự báo, hướng đi và trọng số dưới bảng', async () => {
  const html = await renderTrendsPage('it', DEFAULT_FILTERS, 'jobs');
  expect(html).toContain('Dự báo');
  expect(html).toContain('Đang lên');
  expect(html).toContain('người mới 30%');
});

test('xem 24 tuần thì có nhãn Ước lượng', async () => {
  const html = await renderTrendsPage('it', { ...DEFAULT_FILTERS, weeks: 24 }, 'jobs');
  expect(html).toContain('Ước lượng');
});

test('bộ lọc hẹp: nghề thiếu dữ liệu hiện "Chưa đủ dữ liệu"', async () => {
  const html = await renderTrendsPage('kt', { ...DEFAULT_FILTERS, city: 'dn', level: 'intern' }, 'jobs');
  expect(html).toContain('Chưa đủ dữ liệu');
});
