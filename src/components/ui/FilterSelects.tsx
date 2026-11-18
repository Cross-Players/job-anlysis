'use client';
// Ba ô chọn dùng chung: khung thời gian, cấp bậc, hình thức làm việc.
// Đặt trên thanh lọc của mọi trang; giá trị lưu trong FilterContext nên đổi ở trang nào cũng áp cho cả web.
import { useFilters } from '@/context/FilterContext';
import { LEVELS, WORK_MODES } from '@/lib/constants';
import type { Level, Weeks, WorkMode } from '@/lib/types';

const WEEK_OPTIONS: Weeks[] = [4, 12, 24];

export function FilterSelects() {
  const { weeks, setWeeks, level, setLevel, mode, setMode } = useFilters();
  return (
    <>
      <select className="sel" value={weeks} onChange={(e) => setWeeks(Number(e.target.value) as Weeks)} aria-label="Khung thời gian">
        {WEEK_OPTIONS.map((w) => <option key={w} value={w}>{w} tuần gần nhất</option>)}
      </select>
      <select className="sel" value={level} onChange={(e) => setLevel(e.target.value as Level | 'all')} aria-label="Cấp bậc">
        <option value="all">Mọi cấp bậc</option>
        {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
      </select>
      <select className="sel" value={mode} onChange={(e) => setMode(e.target.value as WorkMode | 'all')} aria-label="Hình thức làm việc">
        <option value="all">Mọi hình thức</option>
        {WORK_MODES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
      </select>
    </>
  );
}

/** Chip cho cấp bậc và hình thức đang lọc (dùng chung ở các thanh lọc) */
export function useLevelModeChips(): { label: string; clear: () => void }[] {
  const { level, setLevel, mode, setMode } = useFilters();
  const chips: { label: string; clear: () => void }[] = [];
  if (level !== 'all') {
    const found = LEVELS.find((l) => l.key === level);
    chips.push({ label: `Cấp bậc: ${found ? found.label : level}`, clear: () => setLevel('all') });
  }
  if (mode !== 'all') {
    const found = WORK_MODES.find((m) => m.key === mode);
    chips.push({ label: `Hình thức: ${found ? found.label : mode}`, clear: () => setMode('all') });
  }
  return chips;
}
