'use client';
import { useRouter } from 'next/navigation';
import { CITIES } from '@/lib/constants';
import { salaryText, viDate, type CompanyRow } from '@/lib/market';

export type SortKey = 'name' | 'n' | 'salaryHi' | 'disclosedPct' | 'latestPosted';

interface Props { rows: CompanyRow[]; sortKey: SortKey; desc: boolean; onSort: (k: SortKey) => void; emptyText: string }

const cityShort = (c: string) => CITIES.find((x) => x.key === c)?.label ?? c;

export function CompanyTable({ rows, sortKey, desc, onSort, emptyText }: Props) {
  const router = useRouter();
  const Th = ({ k, children }: { k: SortKey; children: string }) => (
    <th className={`s ${sortKey === k ? 'hl' : ''}`} onClick={() => onSort(k)}>{children}{sortKey === k ? (desc ? ' ↓' : ' ↑') : ''}</th>
  );
  const cls = (k: SortKey) => (sortKey === k ? 'hl' : '');
  return (
    <div className="card tw">
      <table>
        <thead>
          <tr>
            <Th k="name">Công ty</Th><Th k="n">Tin đang mở</Th><th>Nhóm nghề chính</th>
            <Th k="salaryHi">Khoảng lương công bố</Th><Th k="disclosedPct">Công khai lương</Th><th>Kỹ năng nhắc nhiều</th><Th k="latestPosted">Tin mới nhất</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="r" onClick={() => router.push(`/companies/profile?id=${encodeURIComponent(c.id)}`)}>
              <td><div className="nm">{c.name}</div><div className="mini">{c.cities.map(cityShort).join(' · ')}</div></td>
              <td className={cls('n')}><span className="b">{c.n}</span></td>
              <td><span className="bd">{c.mainGroup}</span></td>
              <td className={cls('salaryHi')}>{salaryText(c.salaryLo, c.salaryHi)}</td>
              <td className={cls('disclosedPct')}>{Math.round(c.disclosedPct)}%</td>
              <td>{c.skills.length ? c.skills.map((s) => <span key={s} className="bd">{s}</span>) : <span className="mini">—</span>}</td>
              <td className={cls('latestPosted')}>{viDate(c.latestPosted)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={7} className="mini" style={{ padding: 24 }}>{emptyText}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
