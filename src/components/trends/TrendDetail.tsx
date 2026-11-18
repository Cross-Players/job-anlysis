'use client';
// Khối "Xu hướng & Dự báo" của một nghề: biểu đồ, nhãn hướng đi, mức chắc chắn,
// độ chính xác của dự báo trước đây, và câu giải thích.
import { Card } from '@/components/ui/Card';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { NotEnough, StatusBadge } from '@/components/ui/Reliability';
import type { CareerRow, TrendDetail as TrendDetailData, TrendMetric } from '@/api/types';
import type { Confidence } from '@/lib/forecast';
import { DirectionTag } from './CareerTable';

interface Props {
  detail: TrendDetailData;
  row: CareerRow | null;
  metric: TrendMetric;
  onMetric: (m: TrendMetric) => void;
}

const CONFIDENCE_LABEL: Record<Confidence, string> = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' };

function MetricSwitch({ metric, onMetric }: { metric: TrendMetric; onMetric: (m: TrendMetric) => void }) {
  return (
    <div className="seg">
      <button className={metric === 'jobs' ? 'on' : ''} onClick={() => onMetric('jobs')}>Số tin</button>
      <button className={metric === 'salary' ? 'on' : ''} onClick={() => onMetric('salary')}>Lương trung vị</button>
    </div>
  );
}

/** Ô bên phải biểu đồ: hướng đi, mức chắc chắn, sai số trước đây */
function ForecastSummary({ detail, metric }: { detail: TrendDetailData; metric: TrendMetric }) {
  const fc = detail.forecast;
  if (!detail.enoughData) return <div className="fs"><NotEnough n={0} /><p className="mini">Quá ít tin để đánh giá xu hướng.</p></div>;
  if (!fc) return <div className="fs"><p className="mini">Chưa đủ dữ liệu để dự báo.</p></div>;

  const what = metric === 'jobs' ? 'Số tin' : 'Lương trung vị';
  const sign = fc.changePct >= 0 ? '+' : '';
  return (
    <div className="fs">
      <div className="mini">{what} 12 tuần tới</div>
      <div className="big"><DirectionTag direction={fc.direction} /></div>
      <div className="mini">{sign}{fc.changePct.toFixed(0)}% so với 12 tuần qua</div>
      <div className="mini">Mức chắc chắn: <b>{CONFIDENCE_LABEL[fc.confidence]}</b></div>
      <StatusBadge kind="forecast" />
      {fc.backtestErrorPct !== null && (
        <p className="mini">Dự báo trước đây sai khoảng ±{fc.backtestErrorPct.toFixed(0)}%</p>
      )}
    </div>
  );
}

export function TrendDetail({ detail, row, metric, onMetric }: Props) {
  const hasEstimate = detail.estimated.some((x) => x);
  const unit = metric === 'jobs' ? 'tin' : 'tr';

  return (
    <Card
      title={`Xu hướng & dự báo · ${detail.group.name}`}
      subtitle={`${detail.group.industryName} · ${detail.history.length} tuần qua và 12 tuần tới · dự báo luôn tính trên 12 tuần gần nhất`}
      action={<MetricSwitch metric={metric} onMetric={onMetric} />}
    >
      <div className="td">
        <div>
          <ForecastChart labels={detail.labels} history={detail.history} estimated={detail.estimated} forecast={detail.enoughData ? detail.forecast : null} unit={unit} />
          <p className="mini legend">
            <span className="ln" /> Thật
            {hasEstimate && <><span className="ln est" /> Ước lượng <StatusBadge kind="estimate" /></>}
            {detail.enoughData && detail.forecast && <><span className="ln fc" /> Dự báo, vùng mờ là khoảng không chắc chắn</>}
          </p>
        </div>
        <ForecastSummary detail={detail} metric={metric} />
      </div>
      {row && <p className="why-box">{row.sentence}</p>}
    </Card>
  );
}
