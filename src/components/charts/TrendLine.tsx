'use client';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
interface Props { cur: number[]; prev?: number[]; labels: string[]; height?: number }

const tick = { fontSize: 11, fill: 'var(--mut)' };

/** Biểu đồ đường tin mới theo tuần (Recharts). Truyền prev để vẽ đường kỳ trước nét đứt. */
export function TrendLine({ cur, prev, labels, height = 230 }: Props) {
  const data = cur.map((v, i) => ({ label: labels[i], cur: v, prev: prev?.[i] }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval={cur.length > 12 ? 3 : cur.length > 6 ? 1 : 0} />
        <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12 }} labelStyle={{ color: 'var(--mut)' }} />
        {prev && <Line type="monotone" dataKey="prev" name="Kỳ trước" stroke="var(--prev)" strokeWidth={2} strokeDasharray="5 4" dot={false} />}
        <Line type="monotone" dataKey="cur" name="Kỳ này" stroke="var(--acc)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--card)', strokeWidth: 2 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
