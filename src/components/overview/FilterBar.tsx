'use client';
// Thanh lọc trang Tổng quan: thành phố, cấp bậc, hình thức (nếu đủ dữ liệu), kèm chip bộ lọc đang áp dụng.
import { useFilters } from '@/context/FilterContext';
import { CitySelect } from '@/components/ui/CitySelect';
import { Chips, FilterSelects, useFilterChips } from '@/components/ui/FilterSelects';

export function FilterBar({ groupName, showMode = true }: { groupName: string | null; showMode?: boolean }) {
  const { setGroup } = useFilters();
  const chips = useFilterChips();
  if (groupName) chips.push({ label: `Nhóm: ${groupName}`, clear: () => setGroup(null) });
  return (
    <div className="bar">
      <CitySelect />
      <FilterSelects showMode={showMode} />
      <div className="chips"><Chips chips={chips} empty="Đang xem cả 3 thành phố, mọi ngành, mọi nhóm nghề" /></div>
    </div>
  );
}
