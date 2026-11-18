'use client';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { ALL_SKILLS, IND } from '@/data/overview';
import { useFilters } from '@/context/FilterContext';
import type { Group } from '@/lib/types';

/** Kỹ năng được nhắc nhiều. Bấm một kỹ năng để sang trang Công ty đã lọc sẵn. */
export function TopSkills({ ind, sel }: { ind: string; sel: Group | null }) {
  const { setSkill } = useFilters();
  const router = useRouter();
  const sk = ind === 'all' ? ALL_SKILLS : IND[ind].sk;
  const [label, ...rows] = sk;
  const f = sel ? 0.75 + (sel.id.length % 5) * 0.12 : 1; // demo: ước tính theo nhóm
  const sm = Math.max(...rows.map((s) => s[1]));
  return (
    <Card title="Kỹ năng được nhắc nhiều" subtitle={`${label} · % tin có nhắc kỹ năng, một tin có thể nhắc nhiều kỹ năng${sel ? ` · ước tính trong nhóm ${sel.name}` : ''}`}>
      {rows.map(([n, p]) => {
        const v = Math.min(95, Math.round(p * f));
        const delta = ((n.length * 7 + p) % 9) - 3;
        return (
          <div key={n} className="sk" style={{ cursor: 'pointer' }} title={`Xem công ty tuyển ${n}`} onClick={() => { setSkill(n); router.push('/companies'); }}>
            <span>{n}</span>
            <div className="trk"><i style={{ width: `${(v / (sm * f)) * 100 * 0.92}%` }} /></div>
            <b style={{ textAlign: 'right' }}>{v}%</b>
            <span className={`dl ${delta >= 0 ? 'up' : 'dn'}`}>{delta >= 0 ? '▲' : '▼'}{Math.abs(delta)}</span>
          </div>
        );
      })}
    </Card>
  );
}
