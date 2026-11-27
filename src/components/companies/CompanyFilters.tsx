'use client';
import { useFilters } from '@/context/FilterContext';
import { CitySelect } from '@/components/ui/CitySelect';
import { Chips, FilterSelects, useFilterChips } from '@/components/ui/FilterSelects';

interface Props { q: string; onQ: (v: string) => void; count: number; showMode?: boolean }

/** Thanh tìm kiếm + bộ lọc chung, kèm chip bộ lọc đang áp dụng (ngành, thành phố, cấp bậc, hình thức, kỹ năng) */
export function CompanyFilters({ q, onQ, count, showMode = true }: Props) {
  const { skill, setSkill } = useFilters();
  const chips = useFilterChips();
  if (skill) chips.push({ label: `Kỹ năng: ${skill}`, clear: () => setSkill('') });
  return (
    <>
      {chips.length > 0 && <div className="bar"><span className="mini">Đang lọc</span><Chips chips={chips} /></div>}
      <div className="bar">
        <input className="inp" placeholder="Tìm công ty" value={q} onChange={(e) => onQ(e.target.value)} />
        <CitySelect />
        <FilterSelects showMode={showMode} />
        <span className="mini" style={{ marginLeft: 'auto' }}>{count} công ty</span>
      </div>
    </>
  );
}
