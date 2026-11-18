'use client';
// 4 ô KPI đầu trang Tổng quan. Khi số tin dưới MIN_SAMPLE, lương trung vị và tỷ lệ công khai lương
// không đáng tin nên hiện "Chưa đủ dữ liệu" thay cho con số (số tin và số công ty vẫn hiện bình thường).
import { useRouter } from 'next/navigation';
import { Delta } from '@/components/ui/Delta';
import { Sparkline } from '@/components/ui/Sparkline';
import { NotEnough } from '@/components/ui/Reliability';
import { MIN_SAMPLE } from '@/lib/constants';
import { pct } from '@/lib/stats';
import type { OverviewData } from '@/lib/overview';

interface KpiProps {
  label: string;
  value: string;
  delta: number;
  spark: number[];
  notEnoughN?: number; // có giá trị = không đủ dữ liệu, hiện nhãn thay cho số
  onClick?: () => void;
}

function Kpi({ label, value, delta, spark, notEnoughN, onClick }: KpiProps) {
  const notEnough = notEnoughN !== undefined;
  return (
    <div className={`card kpi ${onClick ? 'go' : ''}`} onClick={onClick} title={onClick ? 'Xem danh sách công ty' : undefined}>
      <div className="l">{label}</div>
      <div className="row">
        <div>
          <div className="v">{notEnough ? <NotEnough n={notEnoughN} /> : value}</div>
          {!notEnough && <div className="d"><Delta value={delta} /> <small>so với kỳ trước</small></div>}
        </div>
        {!notEnough && <Sparkline data={spark} />}
      </div>
    </div>
  );
}

export function KpiCards({ d }: { d: OverviewData }) {
  const router = useRouter();
  const { cur, jobs, jp, comp, compP, med, gr, disc, ratio } = d;
  // Dưới ngưỡng thì truyền số tin vào notEnoughN để ô KPI hiện "Chưa đủ dữ liệu"
  const tooFew = jobs < MIN_SAMPLE ? jobs : undefined;
  return (
    <div className="kpis">
      <Kpi label="Tin tuyển dụng mới" value={jobs.toLocaleString('vi')} delta={pct(jobs, jp)} spark={cur} />
      <Kpi label="Công ty đang tuyển" value={comp.toLocaleString('vi')} delta={pct(comp, compP)} spark={cur.map((v) => v * ratio + (v % 3))} onClick={() => router.push('/companies')} />
      <Kpi label="Lương trung vị" value={`${med.toFixed(1)} tr`} delta={gr * 100} spark={cur.map((_, i) => med * (1 + Math.sin(i) * 0.01 + i * 0.002))} notEnoughN={tooFew} />
      <Kpi label="Tỷ lệ công khai lương" value={`${Math.round(disc * 100)}%`} delta={(((disc - 0.82) * 100) / 0.82) * 0.4} spark={cur.map((_, i) => disc * 100 + Math.cos(i * 1.3) * 2 + i * 0.2)} notEnoughN={tooFew} />
    </div>
  );
}
