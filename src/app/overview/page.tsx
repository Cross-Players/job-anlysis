'use client';
// Trang Tổng quan: số liệu thật từ snapshot tin IT đang mở, theo bộ lọc chung và nhóm nghề đang chọn.
// Chưa đủ lịch sử nên không có so sánh kỳ trước hay biểu đồ theo tuần (xem trang /trends).
import '@/styles/overview.css';
import { useFilters } from '@/context/FilterContext';
import { getOverview, getSnapshot } from '@/api';
import { useApi } from '@/api/useApi';
import { FilterBar } from '@/components/overview/FilterBar';
import { KpiCards } from '@/components/overview/KpiCards';
import { InsightsCard } from '@/components/overview/InsightsCard';
import { GroupMix } from '@/components/overview/GroupMix';
import { TopSkills } from '@/components/overview/TopSkills';
import { SalaryRanges } from '@/components/overview/SalaryRanges';
import { LevelMix } from '@/components/overview/LevelMix';
import { TopCompanies } from '@/components/overview/TopCompanies';
import { DataSource } from '@/components/ui/DataSource';
import { cityLabel, sectorLabel, viDate } from '@/lib/market';

export default function OverviewPage() {
  const { filters, group, setGroup } = useFilters();
  const snap = useApi(getSnapshot, []);
  const overview = useApi(() => getOverview(filters, group), [filters, group]);
  const d = overview.data;
  const s = snap.data;

  const scope = `${cityLabel(filters.city)}${d?.selected ? ` · ${d.selected.name}` : ''}`;
  const pick = (id: string) => setGroup(group === id ? null : id);

  return (
    <div className="ov">
      <div className="wrap">
        <header>
          <div>
            <h1>Thị trường tuyển dụng · {sectorLabel(filters.sector)}</h1>
            <p className="sub">Hà Nội · Đà Nẵng · TP.HCM · tin đang mở{s ? ` ngày ${viDate(s.generatedAt.slice(0, 10))}` : ''}</p>
          </div>
        </header>
        <FilterBar groupName={d?.selected?.name ?? null} showMode />

        {overview.error && <p className="mini">Không tải được dữ liệu: {overview.error}</p>}
        {!d && !overview.error && <p className="mini">Đang tải dữ liệu…</p>}

        {d && s && (
          <>
            <KpiCards d={d} />
            <InsightsCard d={d} f={filters} />
            <div className="grid2">
              <GroupMix d={d} groupOrder={s.groups.map((g) => g.id)} subtitle={cityLabel(filters.city)} onPick={pick} />
              <TopSkills d={d} subtitle={scope} />
            </div>
            <div className="grid2">
              <LevelMix d={d} subtitle={scope} />
              <SalaryRanges d={d} subtitle={cityLabel(filters.city)} />
            </div>
            <TopCompanies d={d} />
            <DataSource snap={s} />
          </>
        )}
      </div>
    </div>
  );
}
