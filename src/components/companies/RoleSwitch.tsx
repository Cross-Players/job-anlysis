'use client';
import { ROLES } from '@/lib/roles';
import { useFilters } from '@/context/FilterContext';

/** Công tắc "Tôi là...": đổi cột nổi bật, cách sắp xếp và thứ tự khối trong hồ sơ, dữ liệu giữ nguyên */
export function RoleSwitch() {
  const { role, setRole } = useFilters();
  return (
    <div className="bar">
      <span className="mini">Tôi là</span>
      <div className="seg">
        {ROLES.map((r) => <button key={r.key} className={r.key === role ? 'on' : ''} onClick={() => setRole(r.key)}>{r.label}</button>)}
      </div>
    </div>
  );
}
