'use client';
// Bảng "Nghề đáng đầu tư": mỗi dòng một nghề, bấm dòng để xem biểu đồ dự báo của nghề đó.
// Sắp xếp được theo các cột số. Hạng luôn tính theo điểm (thứ tự API trả về), không đổi khi sắp cột khác.
import type { CareerRow } from '@/api/types';
import type { Direction } from '@/lib/forecast';
import { WEIGHTS } from '@/lib/ranking';
import { Delta } from '@/components/ui/Delta';
import { NotEnough } from '@/components/ui/Reliability';

export type CareerSortKey = 'score' | 'demandPct' | 'salaryPct' | 'newcomerPct' | 'companies' | 'daysOpen';

interface Props {
  rows: CareerRow[];
  showIndustry: boolean; // xem tất cả ngành thì ghi thêm tên ngành
  selectedId: string | null;
  onSelect: (id: string) => void;
  sortKey: CareerSortKey;
  desc: boolean;
  onSort: (key: CareerSortKey) => void;
}

const DIRECTION_LABEL: Record<Direction, string> = { up: '▲ Đang lên', flat: '▶ Đi ngang', down: '▼ Đang xuống' };

export function DirectionTag({ direction }: { direction: Direction | null }) {
  if (!direction) return <span className="mini">—</span>;
  return <span className={`dir ${direction}`}>{DIRECTION_LABEL[direction]}</span>;
}

/** Hạng theo điểm: nghề đủ dữ liệu được đánh số 1, 2, 3...; nghề thiếu dữ liệu không có hạng */
function buildRanks(rows: CareerRow[]): Record<string, number> {
  const ranks: Record<string, number> = {};
  let rank = 1;
  for (const r of rows) {
    if (r.enoughData) {
      ranks[r.id] = rank;
      rank++;
    }
  }
  return ranks;
}

function sortRows(rows: CareerRow[], key: CareerSortKey, desc: boolean): CareerRow[] {
  const enough = rows.filter((r) => r.enoughData);
  const notEnough = rows.filter((r) => !r.enoughData);
  enough.sort((a, b) => {
    const diff = (a[key] ?? 0) - (b[key] ?? 0);
    return desc ? -diff : diff;
  });
  return [...enough, ...notEnough]; // nghề thiếu dữ liệu luôn ở cuối
}

// Làm tròn vì máy tính lưu 0.3 không chính xác tuyệt đối: 0.3 × 100 = 30.000000000000004
function asPercent(weight: number): string {
  return `${Math.round(weight * 100)}%`;
}

const COLUMNS: { key: CareerSortKey; label: string }[] = [
  { key: 'score', label: 'Điểm' },
  { key: 'demandPct', label: 'Nhu cầu' },
  { key: 'salaryPct', label: 'Lương' },
  { key: 'newcomerPct', label: '% nhận người mới' },
  { key: 'companies', label: 'Số công ty' },
  { key: 'daysOpen', label: 'Ngày mở TB' },
];

export function CareerTable({ rows, showIndustry, selectedId, onSelect, sortKey, desc, onSort }: Props) {
  const ranks = buildRanks(rows);
  const sorted = sortRows(rows, sortKey, desc);

  return (
    <div className="tw">
      <table className="ct">
        <thead>
          <tr>
            <th>Hạng</th>
            <th>Nghề</th>
            {COLUMNS.slice(0, 1).map((c) => (
              <th key={c.key} className="s" onClick={() => onSort(c.key)}>{c.label}{sortKey === c.key ? (desc ? ' ↓' : ' ↑') : ''}</th>
            ))}
            <th>Hướng đi</th>
            {COLUMNS.slice(1).map((c) => (
              <th key={c.key} className="s" onClick={() => onSort(c.key)}>{c.label}{sortKey === c.key ? (desc ? ' ↓' : ' ↑') : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className={`r ${selectedId === r.id ? 'on' : ''}`} onClick={() => onSelect(r.id)}>
              <td className="rk">{ranks[r.id] ?? '—'}</td>
              <td>
                <b>{r.name}</b>{showIndustry && <span className="mini"> · {r.industryName}</span>}
                <div className="mini why">{r.sentence}</div>
              </td>
              <td>{r.score === null ? <NotEnough n={0} /> : <b className="sc">{r.score}</b>}</td>
              <td><DirectionTag direction={r.direction} /></td>
              <td><Delta value={r.demandPct} digits={0} /></td>
              <td><Delta value={r.salaryPct} digits={1} /></td>
              <td>{r.newcomerPct}%</td>
              <td>{r.companies}</td>
              <td>{r.daysOpen} ngày</td>
            </tr>
          ))}
          {!sorted.length && <tr><td colSpan={9} className="mini" style={{ padding: 20 }}>Không có nghề nào trong ngành này.</td></tr>}
        </tbody>
      </table>
      <p className="foot">
        Điểm 0–100 so với các nghề trong bảng: người mới {asPercent(WEIGHTS.newcomer)}, nhu cầu {asPercent(WEIGHTS.demand)},
        dự báo {asPercent(WEIGHTS.forecast)}, lương {asPercent(WEIGHTS.salary)}, số công ty {asPercent(WEIGHTS.breadth)}.
        Ngày mở TB (độ khó tuyển) chỉ để tham khảo, không tính vào điểm. "% nhận người mới" luôn tính trên mọi cấp bậc.
      </p>
    </div>
  );
}
