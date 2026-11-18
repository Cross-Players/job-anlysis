'use client';
// Trang danh sách công ty: lấy danh sách đã lọc theo bộ lọc chung qua tầng API,
// rồi lọc thêm tại chỗ theo ô tìm kiếm, loại hình, lĩnh vực, kỹ năng và sắp xếp theo cột.
import { useEffect, useMemo, useState } from 'react';
import '@/styles/company.css';
import { useFilters } from '@/context/FilterContext';
import { getCompanies } from '@/api';
import { useApi } from '@/api/useApi';
import { cityLabel } from '@/lib/cities';
import { ROLE_CONFIG, ROLES, type SortKey } from '@/lib/roles';
import type { Company } from '@/lib/types';
import { RoleSwitch } from '@/components/companies/RoleSwitch';
import { CompanyFilters, type CompanyFilterState } from '@/components/companies/CompanyFilters';
import { CompanyTable } from '@/components/companies/CompanyTable';

function matchesFilters(c: Company, f: CompanyFilterState, skill: string): boolean {
  if (f.model && c.model !== f.model) return false;
  if (f.dom && c.dom !== f.dom) return false;
  if (skill && !c.stack.some((x) => x[0] === skill)) return false;
  if (f.q && !c.name.toLowerCase().includes(f.q.toLowerCase())) return false;
  return true;
}

function compareBy(a: Company, b: Company, key: SortKey): number {
  if (a[key] > b[key]) return 1;
  if (a[key] < b[key]) return -1;
  return 0;
}

export default function CompaniesPage() {
  const { ind, role, skill, city, filters } = useFilters();
  const cfg = ROLE_CONFIG[role];
  const [f, setF] = useState<CompanyFilterState>({ q: '', model: '', dom: '' });
  const [sortKey, setSortKey] = useState<SortKey>(cfg.hl);
  const [desc, setDesc] = useState(true);

  useEffect(() => { setSortKey(ROLE_CONFIG[role].hl); setDesc(true); }, [role]); // đổi vai trò thì sắp xếp lại theo cột nổi bật

  const companies = useApi(() => getCompanies(filters), [filters]);
  const noData = ind !== 'all' && ind !== 'it'; // demo chỉ có công ty ngành IT

  const rows = useMemo(() => {
    const list = noData ? [] : companies.data ?? [];
    const filtered = list.filter((c) => matchesFilters(c, f, skill));
    return filtered.sort((a, b) => (desc ? -1 : 1) * compareBy(a, b, sortKey));
  }, [companies.data, f, skill, noData, sortKey, desc]);

  const onSort = (k: SortKey) => { setDesc(sortKey === k ? !desc : true); setSortKey(k); };

  return (
    <div className="co">
      <div className="wrap">
        <header>
          <div><h1>Công ty</h1><p className="sub">Ai đang tuyển, dùng gì, trả bao nhiêu · {cityLabel(city)} · {filters.weeks} tuần gần nhất</p></div>
          <span className="tag">Công ty và số liệu minh họa</span>
        </header>
        <RoleSwitch />
        <div className="hint">Ưu tiên <b>{cfg.tip}</b> Cột nổi bật đã được sắp xếp sẵn cho {ROLES.find((r) => r.key === role)!.label.toLowerCase()}.</div>
        <CompanyFilters value={f} onChange={setF} count={rows.length} />
        {companies.error && <p className="mini">Không tải được dữ liệu: {companies.error}</p>}
        <CompanyTable rows={rows} weeks={filters.weeks} hl={cfg.hl} sortKey={sortKey} desc={desc} onSort={onSort}
          emptyText={noData ? 'Demo chưa có công ty thuộc ngành này.' : companies.loading && !companies.data ? 'Đang tải dữ liệu…' : 'Không có công ty phù hợp. Thử bỏ bớt bộ lọc hoặc đổi thành phố.'} />
        <p className="foot">Đà tuyển = tin mới {filters.weeks} tuần gần nhất so với {filters.weeks} tuần trước đó. Dưới 6 tin thì hiển thị Chưa đủ dữ liệu. Khi chọn thành phố, chỉ hiện công ty có từ 10% tin ở đó; số tin chỉ tính phần khớp thành phố, cấp bậc, hình thức đang chọn. Lương so với nhóm tương đương (cùng chức danh, cấp bậc, thành phố) chỉ tính trên tin có công khai lương. Tên công ty trong demo là hư cấu.</p>
      </div>
    </div>
  );
}
