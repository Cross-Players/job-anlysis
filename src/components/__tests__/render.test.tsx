// Render các thẻ trang Tổng quan và Hồ sơ công ty ra HTML với mọi tổ hợp bộ lọc,
// rồi kiểm tra không có chữ "NaN" / "Infinity" và không thẻ nào bị lỗi khi render.
// (Không cần trình duyệt: renderToString chạy được trong Node.)
import { expect, test, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { getCompany, getOverview } from '@/api';
import { LEVELS, WORK_MODES } from '@/lib/constants';
import type { CityFilter, Filters, Level, Weeks, WorkMode } from '@/lib/types';
import { InsightsCard } from '@/components/overview/InsightsCard';
import { GroupMix } from '@/components/overview/GroupMix';
import { SalaryRanges } from '@/components/overview/SalaryRanges';
import { DemandVsSalary } from '@/components/overview/DemandVsSalary';
import { TrendCard } from '@/components/overview/TrendCard';
import { ProfileKpis } from '@/components/companies/profile/ProfileKpis';
import { ProfileSalary } from '@/components/companies/profile/ProfileSalary';
import { ProfileJobs } from '@/components/companies/profile/ProfileJobs';
import { ProfileTrend } from '@/components/companies/profile/ProfileTrend';

// Recharts cần kích thước thật của trình duyệt; trong Node ta bỏ qua cảnh báo kích thước
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

test('thẻ Tổng quan không hiện NaN ở mọi tổ hợp bộ lọc', async () => {
  const bad: string[] = [];
  for (const f of allFilters()) {
    for (const ind of ['all', 'it', 'kt', 'mk']) {
      const d = await getOverview(ind, null, f);
      const html = renderToString(
        <>
          <InsightsCard d={d} />
          <TrendCard d={d} ind={ind} />
          <GroupMix d={d} ind={ind} sel={null} onPick={() => {}} />
          <SalaryRanges d={d} />
          <DemandVsSalary d={d} />
        </>,
      );
      if (html.includes('NaN') || html.includes('Infinity')) bad.push(`${ind} ${JSON.stringify(f)}`);
    }
  }
  expect(bad.slice(0, 5)).toEqual([]);
});

test('thẻ Hồ sơ công ty không hiện NaN ở mọi tổ hợp bộ lọc', async () => {
  const bad: string[] = [];
  for (const f of allFilters()) {
    for (let id = 0; id < 8; id++) {
      const detail = (await getCompany(id, f))!;
      const html = renderToString(
        <>
          <ProfileKpis c={detail.company} />
          <ProfileTrend c={detail.company} />
          <ProfileSalary rows={detail.peerRows} f={f} />
          <ProfileJobs jobs={detail.jobs} f={f} />
        </>,
      );
      if (html.includes('NaN') || html.includes('Infinity')) bad.push(`${id} ${JSON.stringify(f)}`);
    }
  }
  expect(bad.slice(0, 5)).toEqual([]);
});
