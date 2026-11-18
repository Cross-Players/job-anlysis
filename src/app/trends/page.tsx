'use client';
// Trang Xu hướng: bảng "Nghề đáng đầu tư" + biểu đồ dự báo 12 tuần của nghề đang chọn + kỹ năng.
// Dùng chung bộ lọc với các trang khác. Bấm một dòng trong bảng để đổi nghề.
import { useState } from 'react';
import '@/styles/overview.css';
import '@/styles/trends.css';
import { useFilters } from '@/context/FilterContext';
import { getCareerRanking, getTrend } from '@/api';
import { useApi } from '@/api/useApi';
import type { TrendMetric } from '@/api/types';
import { FilterBar } from '@/components/overview/FilterBar';
import { Card } from '@/components/ui/Card';
import { CareerTable, type CareerSortKey } from '@/components/trends/CareerTable';
import { TrendDetail } from '@/components/trends/TrendDetail';
import { SkillTrends } from '@/components/trends/SkillTrends';

export default function TrendsPage() {
  const { ind, filters } = useFilters();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [metric, setMetric] = useState<TrendMetric>('jobs');
  const [sortKey, setSortKey] = useState<CareerSortKey>('score');
  const [desc, setDesc] = useState(true);

  const ranking = useApi(() => getCareerRanking(ind, filters), [ind, filters]);
  const rows = ranking.data ?? [];

  // Nghề đang chọn không còn trong bảng (ví dụ vừa đổi ngành) thì quay về dòng đầu
  const stillThere = rows.find((r) => r.id === pickedId);
  const selectedId = stillThere ? stillThere.id : rows.length ? rows[0].id : null;
  const selectedRow = rows.find((r) => r.id === selectedId) ?? null;

  const trend = useApi(
    () => (selectedId ? getTrend(selectedId, filters, metric) : Promise.resolve(null)),
    [selectedId, filters, metric],
  );

  const onSort = (key: CareerSortKey) => {
    setDesc(sortKey === key ? !desc : true);
    setSortKey(key);
  };

  return (
    <div className="ov tr">
      <div className="wrap">
        <header>
          <div>
            <h1>Xu hướng & dự báo</h1>
            <p className="sub">Nghề nào đang lên, có tiếp tục lên trong 3 tháng tới không · {filters.weeks} tuần gần nhất</p>
          </div>
          <span className="tag">Dữ liệu mẫu · dự báo minh họa</span>
        </header>
        <FilterBar sel={null} selName={null} onSelChange={() => {}} />

        {ranking.error && <p className="mini">Không tải được dữ liệu: {ranking.error}</p>}
        {!ranking.data && !ranking.error && <p className="mini">Đang tải dữ liệu…</p>}

        {ranking.data && (
          <Card className="mb" title="Nghề đáng đầu tư" subtitle="Xếp theo nhu cầu, lương, số công ty, tỷ lệ nhận người mới và dự báo · bấm một dòng để xem chi tiết">
            <CareerTable rows={rows} showIndustry={ind === 'all'} selectedId={selectedId} onSelect={setPickedId} sortKey={sortKey} desc={desc} onSort={onSort} />
          </Card>
        )}

        {trend.data && (
          <div className="grid">
            <TrendDetail detail={trend.data} row={selectedRow} metric={metric} onMetric={setMetric} />
            <SkillTrends skills={trend.data.skills} groupName={trend.data.group.name} enoughData={trend.data.enoughData} />
          </div>
        )}

        <p className="foot">
          Dự báo hiện dùng đường xu hướng thẳng trên 12 tuần gần nhất, chưa tính mùa vụ (ví dụ dịp Tết). Đoạn "ước lượng" là phần
          dựng lại từ tin còn mở nên có thể thiếu tin đã đóng. Số liệu là dữ liệu mẫu minh họa.
        </p>
      </div>
    </div>
  );
}
