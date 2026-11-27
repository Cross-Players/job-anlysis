// Render các thẻ Tổng quan và Hồ sơ công ty ra HTML với mọi tổ hợp bộ lọc (kể cả snapshot rỗng),
// rồi kiểm tra không có "NaN" / "Infinity" / "undefined" và không thẻ nào lỗi khi render.
import { expect, test, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import { FilterProvider } from '@/context/FilterContext';
import { CITIES, DEFAULT_FILTERS, LEVELS, SECTORS, WORK_MODES } from '@/lib/constants';
import { companyDetail, computeOverview } from '@/lib/market';
import type { CityFilter, Filters, Level, SectorFilter, WorkMode } from '@/lib/types';
import { KpiCards } from '@/components/overview/KpiCards';
import { InsightsCard } from '@/components/overview/InsightsCard';
import { GroupMix } from '@/components/overview/GroupMix';
import { TopSkills } from '@/components/overview/TopSkills';
import { SalaryRanges } from '@/components/overview/SalaryRanges';
import { LevelMix } from '@/components/overview/LevelMix';
import { TopCompanies } from '@/components/overview/TopCompanies';
import { ProfileKpis } from '@/components/companies/profile/ProfileKpis';
import { ProfileJobs } from '@/components/companies/profile/ProfileJobs';
import { ProfileStack } from '@/components/companies/profile/ProfileStack';
import { DataSource } from '@/components/ui/DataSource';
import { makeSnapshot } from '@/test/fixture';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {} }), usePathname: () => '/overview' }));
vi.spyOn(console, 'warn').mockImplementation(() => {}); // Recharts cảnh báo kích thước khi không có trình duyệt

function allFilters(): Filters[] {
  const sectors: SectorFilter[] = ['all', ...SECTORS.map((s) => s.key)];
  const cities: CityFilter[] = ['all', ...CITIES.map((c) => c.key)];
  const levels: (Level | 'all')[] = ['all', ...LEVELS.map((l) => l.key)];
  const modes: (WorkMode | 'all')[] = ['all', ...WORK_MODES.map((m) => m.key)];
  return sectors.flatMap((sector) =>
    cities.flatMap((city) => levels.flatMap((level) => modes.map((mode) => ({ sector, city, level, mode })))),
  );
}

const html = (el: ReactElement) => renderToString(<FilterProvider>{el}</FilterProvider>);
const BAD = /NaN|Infinity|undefined/;

for (const [label, snap] of [['đủ dữ liệu', makeSnapshot(300)], ['ít dữ liệu', makeSnapshot(20)], ['rỗng', makeSnapshot(0)]] as const) {
  test(`Tổng quan không hiện NaN với mọi bộ lọc (${label})`, () => {
    for (const f of allFilters()) {
      for (const group of [null, 'web', 'data']) {
        const d = computeOverview(snap, f, group);
        const out = [
          html(<KpiCards d={d} />),
          html(<InsightsCard d={d} f={f} />),
          html(<GroupMix d={d} groupOrder={snap.groups.map((g) => g.id)} subtitle="x" onPick={() => {}} />),
          html(<TopSkills d={d} subtitle="x" />),
          html(<SalaryRanges d={d} subtitle="x" />),
          html(<LevelMix d={d} subtitle="x" />),
          html(<TopCompanies d={d} />),
          html(<DataSource snap={snap} />),
        ].join('');
        expect(out, `${JSON.stringify(f)} nhóm=${group}`).not.toMatch(BAD);
      }
    }
  });

  test(`Hồ sơ công ty không hiện NaN với mọi bộ lọc (${label})`, () => {
    for (const f of allFilters()) {
      for (const id of ['cong-ty-0', 'cong-ty-5']) {
        const d = companyDetail(snap, id, f);
        if (!d || !d.row) continue;
        const out = html(<><ProfileKpis d={d} /><ProfileJobs jobs={d.jobs} /><ProfileStack stack={d.stack} n={d.jobs.length} /></>);
        expect(out, `${JSON.stringify(f)} ${id}`).not.toMatch(BAD);
      }
    }
  });
}

test('Lương dưới ngưỡng hiện "Chưa đủ dữ liệu" thay vì con số', () => {
  const d = computeOverview(makeSnapshot(20), DEFAULT_FILTERS, null);
  expect(html(<KpiCards d={d} />)).toContain('Chưa đủ dữ liệu');
});
