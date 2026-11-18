'use client';
// Trang Tổng quan: lấy số liệu qua tầng API theo ngành, nhóm đang chọn và bộ lọc chung,
// rồi ghép các thẻ. Trong lúc tải lại (đổi bộ lọc) vẫn giữ số cũ trên màn hình cho đỡ nháy.
import { useState } from 'react';
import '@/styles/overview.css';
import { useFilters } from '@/context/FilterContext';
import { getCompanies, getOverview } from '@/api';
import { useApi } from '@/api/useApi';
import { FilterBar } from '@/components/overview/FilterBar';
import { KpiCards } from '@/components/overview/KpiCards';
import { InsightsCard } from '@/components/overview/InsightsCard';
import { HotCompanies } from '@/components/overview/HotCompanies';
import { TrendCard } from '@/components/overview/TrendCard';
import { GroupMix } from '@/components/overview/GroupMix';
import { TopSkills } from '@/components/overview/TopSkills';
import { SalaryRanges } from '@/components/overview/SalaryRanges';
import { DemandVsSalary } from '@/components/overview/DemandVsSalary';

export default function OverviewPage() {
  const { ind, setInd, filters } = useFilters();
  const [sel, setSel] = useState<string | null>(null);

  const overview = useApi(() => getOverview(ind, sel, filters), [ind, sel, filters]);
  const companies = useApi(() => getCompanies(filters), [filters]);
  const d = overview.data;

  const pick = (id: string) => {
    if (ind === 'all') { setInd(id); setSel(null); } // bấm ngành thì đi sâu vào ngành
    else setSel(sel === id ? null : id); // bấm nhóm nghề thì lọc cả trang
  };

  return (
    <div className="ov">
      <div className="wrap">
        <header>
          <div><h1>Tổng quan thị trường tuyển dụng</h1><p className="sub">Hà Nội · Đà Nẵng · TP.HCM · {filters.weeks} tuần gần nhất</p></div>
          <span className="tag">Dữ liệu mẫu minh họa</span>
        </header>
        <FilterBar sel={sel} selName={d && d.S ? d.S.name : null} onSelChange={setSel} />

        {overview.error && <p className="mini">Không tải được dữ liệu: {overview.error}</p>}
        {!d && !overview.error && <p className="mini">Đang tải dữ liệu…</p>}

        {d && (
          <>
            <KpiCards d={d} />
            <InsightsCard d={d} />
            <div className="grid">
              <TrendCard d={d} ind={ind} />
              <GroupMix d={d} ind={ind} sel={d.S ? d.S.id : null} onPick={pick} />
            </div>
            <div className="grid2">
              <TopSkills ind={ind} sel={d.S} />
              <SalaryRanges d={d} />
            </div>
            <div className="mb"><DemandVsSalary d={d} /></div>
            <HotCompanies ind={ind} companies={companies.data ?? []} weeks={filters.weeks} />
          </>
        )}
        <p className="foot">Dữ liệu minh họa, chưa phản ánh thị trường thực. Số liệu theo thành phố, cấp bậc, hình thức dùng hệ số mô phỏng.</p>
      </div>
    </div>
  );
}
