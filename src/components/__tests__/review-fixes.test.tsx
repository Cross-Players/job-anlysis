// Test cho các lỗi người kiểm tra độc lập tìm ra:
// - Dự báo phải dựa trên 12 tuần gần nhất, không phụ thuộc khung 4/12/24 tuần đang xem
// - Nghề không đủ tin thì không được có nhãn hướng đi
// - Thẻ Tổng quan dưới 30 tin phải hiện "Chưa đủ dữ liệu" thay vì số
// - Kỹ năng của nghề không đủ tin phải hiện "Chưa đủ dữ liệu"
import { expect, test, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

// KpiCards dùng useRouter của Next; trong test không có router thật nên thay bằng bản giả
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: () => {} }) }));
vi.spyOn(console, 'warn').mockImplementation(() => {});

import { getCareerRanking, getOverview, getTrend } from '@/api';
import { DEFAULT_FILTERS } from '@/lib/constants';
import type { Filters } from '@/lib/types';
import { KpiCards } from '@/components/overview/KpiCards';
import { GroupMix } from '@/components/overview/GroupMix';
import { SalaryRanges } from '@/components/overview/SalaryRanges';
import { TrendDetail } from '@/components/trends/TrendDetail';
import { SkillTrends } from '@/components/trends/SkillTrends';

const NARROW: Filters = { ...DEFAULT_FILTERS, city: 'dn', level: 'intern', mode: 'remote' };

function clean(html: string) {
  return html.replace(/<!-- -->/g, '');
}

test('chế độ 4 tuần: Mobile vẫn có dự báo và panel hiện "Đang xuống"', async () => {
  const f: Filters = { ...DEFAULT_FILTERS, weeks: 4 };
  const detail = (await getTrend('it-mobile', f, 'jobs'))!;
  expect(detail.forecast).not.toBeNull();
  const rows = await getCareerRanking('it', f);
  const row = rows.find((r) => r.id === 'it-mobile')!;
  const html = clean(renderToString(<TrendDetail detail={detail} row={row} metric="jobs" onMetric={() => {}} />));
  expect(html).toContain('Đang xuống');
  expect(html).not.toContain('Quá ít tin');
});

test('nghề không có tin nào thì không có nhãn hướng đi', async () => {
  const rows = await getCareerRanking('all', NARROW);
  for (const r of rows) {
    if (!r.enoughData && r.direction !== null) {
      // chỉ được có hướng đi nếu 12 tuần gần nhất đủ tin
      const detail = (await getTrend(r.id, NARROW, 'jobs'))!;
      expect(detail.forecast).not.toBeNull();
    }
  }
  // Đà Nẵng + Intern + Remote gần như không còn tin: không nghề nào được có hướng đi
  expect(rows.every((r) => r.direction === null)).toBe(true);
});

test('KPI dưới 30 tin: lương và tỷ lệ công khai hiện "Chưa đủ dữ liệu"', async () => {
  const d = await getOverview('all', null, NARROW);
  const html = clean(renderToString(<KpiCards d={d} />));
  expect(html).toContain('Chưa đủ dữ liệu');
  expect(html).not.toContain('0.0 tr');
});

test('Cơ cấu với 1–29 tin hiện "Chưa đủ dữ liệu"', async () => {
  // Tìm một bộ lọc cho ra từ 1 đến 29 tin trong ngành Kế toán
  const candidates: Filters[] = [
    { ...DEFAULT_FILTERS, weeks: 4, city: 'dn', level: 'senior' },
    { ...DEFAULT_FILTERS, weeks: 4, city: 'dn', mode: 'hybrid' },
    { ...DEFAULT_FILTERS, weeks: 4, city: 'dn', level: 'lead' },
  ];
  let found = false;
  for (const f of candidates) {
    const d = await getOverview('kt', null, f);
    if (d.tot > 0 && d.tot < 30) {
      found = true;
      const html = clean(renderToString(<GroupMix d={d} ind="kt" sel={null} onPick={() => {}} />));
      expect(html).toContain('Chưa đủ dữ liệu');
    }
  }
  expect(found).toBe(true);
});

test('Lương theo nhóm: nhóm dưới 30 tin có lương không hiện số lương', async () => {
  const d = await getOverview('it', null, NARROW);
  const html = clean(renderToString(<SalaryRanges d={d} />));
  expect(html).toContain('Chưa đủ dữ liệu');
  expect(html).not.toMatch(/class="m">\d+ tr/);
});

test('Kỹ năng của nghề không đủ tin hiện "Chưa đủ dữ liệu"', async () => {
  const detail = (await getTrend('it-web', NARROW, 'jobs'))!;
  const html = clean(renderToString(<SkillTrends skills={detail.skills} groupName={detail.group.name} enoughData={detail.enoughData} />));
  expect(html).toContain('Chưa đủ dữ liệu');
  expect(html).not.toContain('Python');
});
