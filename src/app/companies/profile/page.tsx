'use client';
// Hồ sơ một công ty: /companies/profile?id=<mã công ty>.
// Dùng tham số trên URL thay cho đường dẫn động vì trang build tĩnh, còn danh sách công ty đổi mỗi đêm.
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import '@/styles/company.css';
import { useFilters } from '@/context/FilterContext';
import { getCompany, getSnapshot } from '@/api';
import { useApi } from '@/api/useApi';
import { cityLabel } from '@/lib/market';
import { CitySelect } from '@/components/ui/CitySelect';
import { Chips, FilterSelects, useFilterChips } from '@/components/ui/FilterSelects';
import { DataSource } from '@/components/ui/DataSource';
import { ProfileKpis } from '@/components/companies/profile/ProfileKpis';
import { ProfileStack } from '@/components/companies/profile/ProfileStack';
import { ProfileJobs } from '@/components/companies/profile/ProfileJobs';

function BackLink() {
  return <Link href="/companies" className="back" style={{ display: 'inline-block' }}>← Về danh sách công ty</Link>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="co"><div className="wrap"><BackLink />{children}</div></div>;
}

function CompanyProfile() {
  const id = useSearchParams().get('id') ?? '';
  const { city, filters } = useFilters();
  const chips = useFilterChips();
  const snap = useApi(getSnapshot, []);
  const detail = useApi(() => getCompany(id, filters), [id, filters]);

  if (detail.error) return <Shell><p>Không tải được dữ liệu: {detail.error}</p></Shell>;
  if (!detail.data) return <Shell><p>{detail.loading ? 'Đang tải dữ liệu…' : 'Không tìm thấy công ty (có thể công ty đã đóng hết tin).'}</p></Shell>;

  const d = detail.data;
  return (
    <Shell>
      <div className="ph">
        <div>
          <h1>{d.name}</h1>
          <div className="mini" style={{ marginTop: 6 }}>{d.total} tin đang mở ở 3 thành phố · loại hình, lĩnh vực, quy mô chưa có dữ liệu</div>
        </div>
      </div>
      <div className="bar">
        <span className="mini">Đang xem</span>
        <CitySelect />
        <FilterSelects showMode />
        <Chips chips={chips} />
      </div>
      {!d.row ? (
        <div className="ev" style={{ marginBottom: 12 }}>Công ty không có tin nào khớp bộ lọc đang chọn ({cityLabel(city)}). Thử bỏ bớt bộ lọc.</div>
      ) : (
        <div className="stack">
          <ProfileKpis d={d} />
          <ProfileJobs jobs={d.jobs} />
          <ProfileStack stack={d.stack} n={d.jobs.length} />
        </div>
      )}
      {snap.data && <DataSource snap={snap.data} />}
    </Shell>
  );
}

export default function CompanyProfilePage() {
  return (
    <Suspense fallback={<Shell><p>Đang tải dữ liệu…</p></Shell>}>
      <CompanyProfile />
    </Suspense>
  );
}
