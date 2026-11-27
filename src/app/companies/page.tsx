'use client';
// Trang danh sách công ty: các công ty có tin IT đang mở khớp bộ lọc chung,
// lọc thêm tại chỗ theo ô tìm kiếm và sắp xếp theo cột.
import { useMemo, useState } from 'react';
import '@/styles/company.css';
import { useFilters } from '@/context/FilterContext';
import { getCompanies, getSnapshot } from '@/api';
import { useApi } from '@/api/useApi';
import { cityLabel, sectorLabel, type CompanyRow } from '@/lib/market';
import { CompanyFilters } from '@/components/companies/CompanyFilters';
import { CompanyTable, type SortKey } from '@/components/companies/CompanyTable';
import { DataSource } from '@/components/ui/DataSource';

function compareBy(a: CompanyRow, b: CompanyRow, key: SortKey): number {
  const x = a[key] ?? -Infinity;
  const y = b[key] ?? -Infinity;
  if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y, 'vi');
  return x > y ? 1 : x < y ? -1 : 0;
}

export default function CompaniesPage() {
  const { skill, city, filters } = useFilters();
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('n');
  const [desc, setDesc] = useState(true);

  const snap = useApi(getSnapshot, []);
  const companies = useApi(() => getCompanies(filters, skill), [filters, skill]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = (companies.data ?? []).filter((c) => !needle || c.name.toLowerCase().includes(needle));
    return list.sort((a, b) => (desc ? -1 : 1) * compareBy(a, b, sortKey) || a.name.localeCompare(b.name, 'vi'));
  }, [companies.data, q, sortKey, desc]);

  const onSort = (k: SortKey) => { setDesc(sortKey === k ? !desc : k !== 'name'); setSortKey(k); };

  return (
    <div className="co">
      <div className="wrap">
        <header>
          <div><h1>Công ty</h1><p className="sub">Ai đang tuyển ({sectorLabel(filters.sector)}), tuyển nhóm nghề nào, trả bao nhiêu · {cityLabel(city)}</p></div>
          <span className="tag">Dữ liệu thật</span>
        </header>
        <CompanyFilters q={q} onQ={setQ} count={rows.length} showMode />
        {companies.error && <p className="mini">Không tải được dữ liệu: {companies.error}</p>}
        <CompanyTable rows={rows} sortKey={sortKey} desc={desc} onSort={onSort}
          emptyText={companies.loading && !companies.data ? 'Đang tải dữ liệu…' : 'Không có công ty phù hợp. Thử bỏ bớt bộ lọc hoặc đổi thành phố.'} />
        <p className="foot">Khoảng lương = thấp nhất đến cao nhất trong các tin công khai lương của công ty (triệu VND/tháng). Loại hình, lĩnh vực, quy mô công ty chưa có: sẽ bổ sung khi có bước phân loại công ty.</p>
        {snap.data && <DataSource snap={snap.data} />}
      </div>
    </div>
  );
}
