'use client';
// Trang hồ sơ một công ty: lấy hồ sơ đã lọc qua tầng API, sắp các khối theo vai trò người xem.
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import '@/styles/company.css';
import { useFilters } from '@/context/FilterContext';
import { getCompany } from '@/api';
import { useApi } from '@/api/useApi';
import { ROLE_CONFIG, ROLES, roleSummary, type ProfileSection } from '@/lib/roles';
import { companyStatus } from '@/lib/stats';
import { cityLabel } from '@/lib/cities';
import { RoleSwitch } from '@/components/companies/RoleSwitch';
import { FilterSelects, useLevelModeChips } from '@/components/ui/FilterSelects';
import { CitySelect } from '@/components/ui/CitySelect';
import { ProfileKpis } from '@/components/companies/profile/ProfileKpis';
import { ProfileTrend } from '@/components/companies/profile/ProfileTrend';
import { ProfileStack } from '@/components/companies/profile/ProfileStack';
import { ProfileSalary } from '@/components/companies/profile/ProfileSalary';
import { ProfileJobs } from '@/components/companies/profile/ProfileJobs';

function BackLink() {
  return <Link href="/companies" className="back" style={{ display: 'inline-block' }}>← Về danh sách công ty</Link>;
}

export default function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { role, city, setCity, filters } = useFilters();
  const levelModeChips = useLevelModeChips();
  const detail = useApi(() => getCompany(Number(id), filters), [id, filters]);

  if (detail.error) return <div className="co"><div className="wrap"><BackLink /><p>Không tải được dữ liệu: {detail.error}</p></div></div>;
  if (!detail.data) {
    const text = detail.loading ? 'Đang tải dữ liệu…' : 'Không tìm thấy công ty.';
    return <div className="co"><div className="wrap"><BackLink /><p>{text}</p></div></div>;
  }

  const { company: c, peerRows, jobs, thin } = detail.data;
  const sections: Record<ProfileSection, ReactNode> = {
    kpi: <ProfileKpis c={c} />,
    trend: <ProfileTrend c={c} />,
    stack: <ProfileStack c={c} />,
    sal: <ProfileSalary rows={peerRows} f={filters} />,
    jobs: <ProfileJobs jobs={jobs} f={filters} />,
  };
  const status = companyStatus(c);

  return (
    <div className="co">
      <div className="wrap">
        <BackLink />
        <div className="ph">
          <div>
            <h1>{c.name}</h1>
            <span className="bd m">{c.model}</span><span className="bd">{c.dom}</span><span className="bd">{c.size} nhân sự</span>
            <div className="mini" style={{ marginTop: 6 }}>Nguồn nhãn: {c.ev}</div>
          </div>
          <button className="btn" onClick={(e) => { e.currentTarget.textContent = 'Đã ghi nhận, cảm ơn bạn'; }}>Báo thông tin sai</button>
        </div>
        <RoleSwitch />
        <div className="bar">
          <span className="mini">Đang xem</span>
          <CitySelect />
          <FilterSelects />
          {city !== 'all' && <span className="chip">Thành phố: {cityLabel(city)}<button aria-label="Bỏ lọc" onClick={() => setCity('all')}>✕</button></span>}
          {levelModeChips.map((chip) => (
            <span key={chip.label} className="chip">{chip.label}<button aria-label="Bỏ lọc" onClick={chip.clear}>✕</button></span>
          ))}
        </div>
        {thin && <div className="ev" style={{ marginBottom: 12 }}>Công ty có rất ít tin ở {cityLabel(city)} (dưới 10%), số liệu chỉ mang tính tham khảo.</div>}
        <div className="hint"><b>Tóm tắt cho {ROLES.find((r) => r.key === role)!.label.toLowerCase()}:</b> {roleSummary(c, role, status.label)}</div>
        {c.j < 6 && <div className="ev" style={{ marginBottom: 12 }}>Công ty có ít tin khớp bộ lọc trong kỳ nên đà tuyển dụng chỉ mang tính tham khảo.</div>}
        <div className="stack">{ROLE_CONFIG[role].order.map((k) => <div key={k}>{sections[k]}</div>)}</div>
      </div>
    </div>
  );
}
