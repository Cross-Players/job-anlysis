'use client';
// 4 ô KPI đầu trang Tổng quan. Chưa có số tuần trước để so sánh nên không hiện "so với kỳ trước".
// Lương trung vị chỉ hiện khi đủ MIN_SAMPLE tin công khai lương.
import { useRouter } from 'next/navigation';
import { NotEnough } from '@/components/ui/Reliability';
import { MIN_SAMPLE } from '@/lib/constants';
import type { OverviewData } from '@/lib/market';

function Kpi({ label, value, note, onClick }: { label: string; value: React.ReactNode; note: string; onClick?: () => void }) {
  return (
    <div className={`card kpi ${onClick ? 'go' : ''}`} onClick={onClick} title={onClick ? 'Xem danh sách công ty' : undefined}>
      <div className="l">{label}</div>
      <div className="v">{value}</div>
      <div className="mini">{note}</div>
    </div>
  );
}

export function KpiCards({ d }: { d: OverviewData }) {
  const router = useRouter();
  const salaryN = d.salary?.n ?? 0;
  return (
    <div className="kpis">
      <Kpi label="Tin đang mở" value={d.n.toLocaleString('vi-VN')} note="Tin còn hiển thị trên nguồn ở lần quét gần nhất" />
      <Kpi label="Công ty đang tuyển" value={d.companies.toLocaleString('vi-VN')} note="Bấm để xem danh sách" onClick={() => router.push('/companies')} />
      <Kpi
        label="Lương trung vị"
        value={d.salary && salaryN >= MIN_SAMPLE ? `${d.salary.med.toFixed(1)} tr` : <NotEnough n={salaryN} />}
        note={d.salary && salaryN >= MIN_SAMPLE ? `P25–P75: ${d.salary.p25.toFixed(0)}–${d.salary.p75.toFixed(0)} tr/tháng · n = ${salaryN}` : `Cần ít nhất ${MIN_SAMPLE} tin công khai lương`}
      />
      <Kpi label="Tỷ lệ công khai lương" value={d.n ? `${Math.round(d.disclosedPct)}%` : '—'} note={`${salaryN}/${d.n} tin ghi rõ mức lương`} />
    </div>
  );
}
