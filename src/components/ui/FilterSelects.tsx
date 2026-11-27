'use client';
// Ô chọn ngành, cấp bậc và hình thức làm việc, dùng chung ở mọi trang; giá trị lưu trong FilterContext.
import { useFilters } from '@/context/FilterContext';
import { LEVELS, SECTORS, WORK_MODES } from '@/lib/constants';
import type { Level, SectorFilter, WorkMode } from '@/lib/types';

export function FilterSelects({ showMode = true }: { showMode?: boolean }) {
  const { sector, setSector, level, setLevel, mode, setMode } = useFilters();
  return (
    <>
      <select className="sel" value={sector} onChange={(e) => setSector(e.target.value as SectorFilter)} aria-label="Ngành">
        <option value="all">Mọi ngành</option>
        {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
      <select className="sel" value={level} onChange={(e) => setLevel(e.target.value as Level | 'all')} aria-label="Cấp bậc">
        <option value="all">Mọi cấp bậc</option>
        {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
      </select>
      {showMode && (
        <select className="sel" value={mode} onChange={(e) => setMode(e.target.value as WorkMode | 'all')} aria-label="Hình thức làm việc">
          <option value="all">Mọi hình thức</option>
          {WORK_MODES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      )}
    </>
  );
}

export interface Chip { label: string; clear: () => void }

/** Chip cho ngành, thành phố, cấp bậc, hình thức đang lọc (dùng chung ở các thanh lọc) */
export function useFilterChips(): Chip[] {
  const { sector, setSector, city, setCity, level, setLevel, mode, setMode } = useFilters();
  const chips: Chip[] = [];
  if (sector !== 'all') chips.push({ label: `Ngành: ${SECTORS.find((s) => s.key === sector)?.label ?? sector}`, clear: () => setSector('all') });
  if (city !== 'all') chips.push({ label: `Thành phố: ${city === 'hn' ? 'Hà Nội' : city === 'dn' ? 'Đà Nẵng' : 'TP.HCM'}`, clear: () => setCity('all') });
  if (level !== 'all') chips.push({ label: `Cấp bậc: ${LEVELS.find((l) => l.key === level)?.label ?? level}`, clear: () => setLevel('all') });
  if (mode !== 'all') chips.push({ label: `Hình thức: ${WORK_MODES.find((m) => m.key === mode)?.label ?? mode}`, clear: () => setMode('all') });
  return chips;
}

export function Chips({ chips, empty }: { chips: Chip[]; empty?: string }) {
  if (!chips.length) return empty ? <span className="mini">{empty}</span> : null;
  return (
    <>
      {chips.map((c) => (
        <span key={c.label} className="chip">{c.label}<button aria-label="Bỏ lọc" onClick={c.clear}>✕</button></span>
      ))}
    </>
  );
}
