'use client';
// Thanh lọc của trang Tổng quan và Xu hướng: ngành, thời gian, thành phố, cấp bậc, hình thức,
// kèm các chip bộ lọc đang áp dụng (bấm ✕ để bỏ).
import { IND, INDUSTRY_KEYS } from '@/data/overview';
import { useFilters } from '@/context/FilterContext';
import { CitySelect } from '@/components/ui/CitySelect';
import { FilterSelects, useLevelModeChips } from '@/components/ui/FilterSelects';
import { cityLabel } from '@/lib/cities';

interface Props { sel: string | null; selName: string | null; onSelChange: (v: string | null) => void }

export function FilterBar({ sel, selName, onSelChange }: Props) {
  const { ind, setInd, city, setCity } = useFilters();
  const levelModeChips = useLevelModeChips();

  const chips: { label: string; clear: () => void }[] = [];
  if (ind !== 'all') chips.push({ label: `Ngành: ${IND[ind].name}`, clear: () => { setInd('all'); onSelChange(null); } });
  if (city !== 'all') chips.push({ label: `Thành phố: ${cityLabel(city)}`, clear: () => setCity('all') });
  for (const chip of levelModeChips) chips.push(chip);
  if (sel && selName) chips.push({ label: `Nhóm: ${selName}`, clear: () => onSelChange(null) });

  const industryButtons = [['all', 'Tất cả ngành'], ...INDUSTRY_KEYS.map((k) => [k, IND[k].name])];

  return (
    <div className="bar">
      <div className="seg">
        {industryButtons.map(([k, n]) => (
          <button key={k} className={k === ind ? 'on' : ''} onClick={() => { setInd(k); onSelChange(null); }}>{n}</button>
        ))}
      </div>
      <CitySelect />
      <FilterSelects />
      <div className="chips">
        {chips.length ? chips.map((c) => (
          <span key={c.label} className="chip">{c.label}<button aria-label="Bỏ lọc" onClick={c.clear}>✕</button></span>
        )) : <span className="mini">Đang xem cả 3 thành phố, mọi ngành</span>}
      </div>
    </div>
  );
}
