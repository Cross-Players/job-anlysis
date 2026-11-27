import { MIN_SALARY_SAMPLE } from '@/lib/constants';
import { salaryText, viDate, type CompanyDetail } from '@/lib/market';

export function ProfileKpis({ d }: { d: CompanyDetail }) {
  const r = d.row!;
  return (
    <div className="card kp">
      <div><div className="l">Tin đang mở</div><div className="v">{r.n}</div><div className="mini">khớp bộ lọc · {r.mainGroup}</div></div>
      <div><div className="l">Khoảng lương công bố</div><div className="v">{salaryText(r.salaryLo, r.salaryHi)}</div><div className="mini">{r.salaryN}/{r.n} tin công khai lương</div></div>
      <div>
        <div className="l">Lương trung vị</div>
        <div className="v">{d.salary && d.salary.n >= MIN_SALARY_SAMPLE ? `${d.salary.med.toFixed(1)} tr` : '—'}</div>
        <div className="mini">{d.salary && d.salary.n >= MIN_SALARY_SAMPLE ? `n = ${d.salary.n}` : `Cần ít nhất ${MIN_SALARY_SAMPLE} tin có lương`}</div>
      </div>
      <div><div className="l">Tin mới nhất</div><div className="v">{viDate(r.latestPosted)}</div><div className="mini">Ngày đăng theo nguồn</div></div>
    </div>
  );
}
