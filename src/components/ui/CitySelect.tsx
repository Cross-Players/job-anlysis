'use client';
import { CITIES } from '@/data/cities';
import { useFilters } from '@/context/FilterContext';
import type { CityFilter } from '@/lib/types';

/** Chọn thành phố, dùng chung state giữa Tổng quan và Công ty */
export function CitySelect() {
  const { city, setCity } = useFilters();
  return (
    <select className="sel" value={city} onChange={(e) => setCity(e.target.value as CityFilter)} aria-label="Thành phố">
      <option value="all">Cả 3 thành phố</option>
      {CITIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
    </select>
  );
}
