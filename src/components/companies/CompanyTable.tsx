'use client';
import { useRouter } from 'next/navigation';
import { Delta, RatioBadge } from '@/components/ui/Delta';
import { Sparkline } from '@/components/ui/Sparkline';
import { companyStatus } from '@/lib/stats';
import type { SortKey } from '@/lib/roles';
import type { Company } from '@/lib/types';

interface Props { rows: Company[]; weeks: number; hl: SortKey; sortKey: SortKey; desc: boolean; onSort: (k: SortKey) => void; emptyText: string }

export function CompanyTable({ rows, weeks, hl, sortKey, desc, onSort, emptyText }: Props) {
  const router = useRouter();
  const Th = ({ k, children }: { k: SortKey; children: string }) => (
    <th className={`s ${hl === k ? 'hl' : ''}`} onClick={() => onSort(k)}>{children}{sortKey === k ? (desc ? ' ↓' : ' ↑') : ''}</th>
  );
  const cls = (k: SortKey) => (hl === k ? 'hl' : '');
  return (
    <div className="card tw">
      <table>
        <thead>
          <tr>
            <Th k="name">Công ty</Th><th>Loại hình · Lĩnh vực</th><Th k="j">{`Tin mới ${weeks} tuần`}</Th>
            <Th k="g">{`Đà tuyển (${weeks} tuần vs ${weeks} tuần trước)`}</Th><Th k="ratio">Lương vs nhóm tương đương</Th><Th k="disc">Công khai lương</Th><th>Stack chính</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const s = companyStatus(c);
            return (
              <tr key={c.id} className="r" onClick={() => router.push(`/companies/${c.id}`)}>
                <td><div className="nm">{c.name}</div><div className="mini">{c.size} nhân sự</div></td>
                <td><span className="bd m">{c.model}</span><span className="bd">{c.dom}</span></td>
                <td className={cls('j')}><span className="b">{c.j}</span> <Sparkline data={c.w} width={70} height={24} /></td>
                <td className={cls('g')}>
                  {c.j < 6 ? <span className="mini">—</span> : <><Delta value={c.g} digits={0} /> <span className="mini">({c.j - c.p >= 0 ? '+' : ''}{c.j - c.p} tin)</span></>} <span className={`st ${s.tone}`}>{s.label}</span>
                </td>
                <td className={cls('ratio')}><RatioBadge ratio={c.ratio} /></td>
                <td className={cls('disc')}>{Math.round(c.disc * 100)}%</td>
                <td>{c.stack.slice(0, 3).map((x) => <span key={x[0]} className="bd">{x[0]}</span>)}</td>
              </tr>
            );
          })}
          {!rows.length && <tr><td colSpan={7} className="mini" style={{ padding: 24 }}>{emptyText}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
