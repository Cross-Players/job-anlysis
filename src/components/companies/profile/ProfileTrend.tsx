import { Card } from '@/components/ui/Card';
import { TrendLine } from '@/components/charts/TrendLine';
import { companyStatus, weekLabels } from '@/lib/stats';
import type { Company } from '@/lib/types';

export function ProfileTrend({ c }: { c: Company }) {
  const s = companyStatus(c);
  return (
    <Card title={`Đà tuyển dụng ${c.w.length} tuần`} subtitle={`Tin mới theo tuần · đà tuyển = ${c.w.length} tuần này so với ${c.w.length} tuần trước`}>
      <p style={{ margin: '0 0 6px' }}><span className={`st ${s.tone}`}>{s.label}</span></p>
      <TrendLine cur={c.w} labels={weekLabels(c.w.length)} height={200} />
    </Card>
  );
}
