'use client';
import { useFilters } from '@/context/FilterContext';
import { CITIES } from '@/lib/constants';
import type { CityFilter } from '@/lib/types';

/** Chọn thành phố, dùng chung state giữa các trang */
export function CitySelect() {
  const { city, setCity } = useFilters();
  return (
    <select className="sel" value={city} onChange={(e) => setCity(e.target.value as CityFilter)} aria-label="Thành phố">
      <option value="all">Cả 3 thành phố</option>
      {CITIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
    </select>
  );
}
