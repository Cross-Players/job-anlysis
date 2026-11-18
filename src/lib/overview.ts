// Gom mọi số liệu mà trang Tổng quan cần, theo ngành, nhóm nghề đang chọn và bộ lọc chung.
// Thứ tự: lấy danh sách dòng hiển thị (G) → xác định phạm vi đang xem (cả ngành hay một nhóm)
// → cộng số tin, lương, tỷ lệ công khai lương trong phạm vi đó.
import { GROUP_SERIES } from '@/data/series';
import { IND } from '@/data/overview';
import { getGroups, pct, seriesOfGroups } from './stats';
import { groupPrevSalary, groupStats, seriesOfIndustry } from './series';
import type { Filters, Group, GroupSeries } from './types';

/** Các nhóm nghề gốc nằm trong phạm vi đang xem */
function scopeSeries(ind: string, selected: Group | null): GroupSeries[] {
  if (ind === 'all') {
    return selected ? seriesOfIndustry(selected.id) : GROUP_SERIES; // đã chọn một ngành
  }
  if (selected) return GROUP_SERIES.filter((g) => g.id === selected.id); // đã chọn một nhóm nghề
  return seriesOfIndustry(ind);
}

/** Lương trung vị kỳ này và kỳ trước, trung bình có trọng số theo số tin có lương */
function medianSalaries(list: GroupSeries[], f: Filters): { now: number; before: number } {
  let weightTotal = 0;
  let nowTotal = 0;
  let beforeTotal = 0;
  for (const g of list) {
    const s = groupStats(g, f);
    weightTotal += s.n;
    nowTotal += s.med * s.n;
    beforeTotal += groupPrevSalary(g, f) * s.n;
  }
  if (weightTotal === 0) return { now: 0, before: 0 };
  return { now: nowTotal / weightTotal, before: beforeTotal / weightTotal };
}

/** Tỷ lệ tin có công khai lương, trung bình có trọng số theo số tin */
function disclosedRate(list: GroupSeries[], f: Filters): number {
  let jobsTotal = 0;
  let disclosedTotal = 0;
  for (const g of list) {
    const jobs = groupStats(g, f).jobs;
    jobsTotal += jobs;
    disclosedTotal += jobs * g.disclosed;
  }
  return jobsTotal === 0 ? 0 : disclosedTotal / jobsTotal;
}

export function computeOverview(ind: string, sel: string | null, f: Filters) {
  const G = getGroups(ind, f);
  let tot = 0;
  for (const g of G) tot += g.jobs;

  // Nhóm đang chọn không còn trong danh sách (ví dụ vừa đổi ngành) thì coi như chưa chọn
  const S = sel ? G.find((g) => g.id === sel) ?? null : null;
  const A = S ? [S] : G;

  const list = scopeSeries(ind, S);
  const { cur, prev } = seriesOfGroups(list, f);

  let jobs = 0;
  let jp = 0;
  for (const g of A) {
    jobs += g.jobs;
    jp += g.prev;
  }

  const salary = medianSalaries(list, f);
  const gr = salary.before ? (salary.now - salary.before) / salary.before : 0;
  const ratio = ind === 'all' ? 0.45 : IND[ind].ratio;
  const disc = disclosedRate(list, f);
  const comp = Math.round(jobs * ratio);
  const compP = Math.round(jp * ratio * 1.03);

  return {
    city: f.city, weeks: f.weeks, G, tot, S, cur, prev, jobs, jp,
    med: salary.now, gr, ratio, disc, comp, compP, jobsDelta: pct(jobs, jp),
  };
}
export type OverviewData = ReturnType<typeof computeOverview>;
