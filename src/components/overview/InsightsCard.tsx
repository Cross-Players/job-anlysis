'use client';
// Thẻ phân tích thị trường tự động sinh từ số liệu thực tế theo bộ lọc và nhóm nghề đang chọn.
import type { Filters } from '@/lib/types';
import type { OverviewData } from '@/lib/market';
import { sectorLabel, cityLabel } from '@/lib/market';

interface Props {
  d: OverviewData;
  f: Filters;
}

export function InsightsCard({ d, f }: Props) {
  if (d.n === 0) {
    return (
      <div className="card ins">
        <h3>Phân tích & Điểm nhấn thị trường</h3>
        <p>Không có dữ liệu phù hợp với tổ hợp bộ lọc hiện tại. Hãy thử chọn lại thành phố hoặc hình thức làm việc khác.</p>
      </div>
    );
  }

  const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

  // 1. Phân tích nhu cầu tuyển dụng & tỷ trọng
  let demandText: React.ReactNode;
  if (d.selected) {
    const share = pct(d.n, d.groupTotal);
    demandText = (
      <span>
        Vị trí <b>{d.selected.name}</b> hiện có <b>{d.n} tin tuyển dụng</b> từ <b>{d.companies} doanh nghiệp</b> đang mở, chiếm <b>{share}%</b> tổng nhu cầu tuyển dụng trong phân khúc ({cityLabel(f.city)}).
      </span>
    );
  } else if (d.groups.length > 0) {
    const top = d.groups[0];
    const topShare = pct(top.n, d.groupTotal);
    const second = d.groups[1];
    demandText = (
      <span>
        Nhóm <b>{top.name}</b> đang dẫn đầu nhu cầu tuyển dụng với <b>{top.n} tin</b> ({topShare}% thị phần){second ? <>, tiếp theo là <b>{second.name}</b> với {second.n} tin ({pct(second.n, d.groupTotal)}%)</> : ''} trên tổng số <b>{d.n} tin</b> tại {cityLabel(f.city)}.
      </span>
    );
  }

  // 2. Phân tích mức lương & thu nhập
  let salaryText: React.ReactNode;
  if (d.salary && d.salary.n >= 10) {
    salaryText = (
      <span>
        Lương trung vị ghi nhận ở mức <b>{d.salary.med.toFixed(0)} triệu VND/tháng</b>, với 50% dải lương phổ biến dao động từ <b>{d.salary.p25.toFixed(0)} – {d.salary.p75.toFixed(0)} triệu/tháng</b> ({Math.round(d.disclosedPct)}% tin công khai mức lương).
      </span>
    );
  } else {
    salaryText = (
      <span>
        Có <b>{Math.round(d.disclosedPct)}%</b> tin tuyển dụng công khai mức lương ({d.salary?.n ?? 0}/{d.n} tin); phần lớn các vị trí còn lại thỏa thuận theo năng lực và kinh nghiệm ứng viên.
      </span>
    );
  }

  // 3. Phân tích kỹ năng trọng tâm
  let skillsText: React.ReactNode = null;
  if (d.skills.length > 0) {
    const top3 = d.skills.slice(0, 3);
    skillsText = (
      <span>
        Kỹ năng được săn đón nhiều nhất:{' '}
        {top3.map((s, idx) => (
          <span key={s.name}>
            {idx > 0 ? ', ' : ''}
            <b>{s.name}</b> ({Math.round(s.pct)}% tin)
          </span>
        ))}
        .
      </span>
    );
  }

  // 4. Phân tích cấp bậc & cơ hội cho người mới
  let levelText: React.ReactNode = null;
  if (d.levelKnown > 0) {
    if (d.newcomerPct >= 35) {
      levelText = (
        <span>
          Cơ hội rộng mở cho người mới: <b>{Math.round(d.newcomerPct)}%</b> vị trí tuyển dụng sẵn sàng đón nhận cấp bậc Intern / Fresher / Junior.
        </span>
      );
    } else {
      levelText = (
        <span>
          Thị trường ưu tiên nhân sự có kinh nghiệm: <b>{Math.round(100 - d.newcomerPct)}%</b> vị trí yêu cầu từ cấp độ Middle đến Quản lý / Senior.
        </span>
      );
    }
  }

  return (
    <div className="card ins">
      <h3>Phân tích & Điểm nhấn thị trường · {sectorLabel(f.sector)}</h3>
      {demandText && <p>{demandText}</p>}
      {salaryText && <p>{salaryText}</p>}
      {skillsText && <p>{skillsText}</p>}
      {levelText && <p>{levelText}</p>}
    </div>
  );
}
