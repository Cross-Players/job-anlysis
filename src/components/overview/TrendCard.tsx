'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { TrendLine } from '@/components/charts/TrendLine';
import { IND } from '@/data/overview';
import type { OverviewData } from '@/lib/overview';
import { cityLabel } from '@/lib/cities';
import { weekLabels } from '@/lib/stats';

export function TrendCard({ d, ind }: { d: OverviewData; ind: string }) {
  const [showPrev, setShowPrev] = useState(true);
  const scope = d.S ? d.S.name : ind === 'all' ? 'Tất cả ngành' : IND[ind].name;
  return (
    <Card
      title="Tin tuyển dụng mới theo tuần"
      subtitle={`${scope} · ${cityLabel(d.city)} · tin có ngày đăng lần đầu trong tuần`}
      action={<label className="t"><input type="checkbox" checked={showPrev} onChange={(e) => setShowPrev(e.target.checked)} /> So với kỳ trước</label>}
    >
      <TrendLine cur={d.cur} prev={showPrev ? d.prev : undefined} labels={weekLabels(d.weeks)} />
    </Card>
  );
}
