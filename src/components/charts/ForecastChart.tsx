'use client';
// Biểu đồ lịch sử + dự báo 12 tuần tới cho một nhóm nghề.
// - Đường liền: số thật. Đoạn "ước lượng" (dựng lại từ quá khứ) cùng màu nhưng nhạt hơn.
// - Đường nét đứt: dự báo. Vùng mờ: khoảng không chắc chắn (rộng dần càng xa hôm nay).
// Chỉ một trục y, theo skill dataviz.
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ForecastResult } from '@/lib/forecast';

interface Props {
  labels: string[];
  history: number[];
  estimated: boolean[];
  forecast: ForecastResult | null;
  unit: string; // 'tin' hoặc 'tr'
}

// Một điểm trên trục x. Mỗi đường chỉ có giá trị ở đoạn của nó, còn lại để undefined (Recharts bỏ trống).
interface ChartRow {
  label: string;
  real?: number;
  est?: number;
  fc?: number;
  band?: [number, number];
  kind: 'real' | 'est' | 'fc';
}

function buildRows(labels: string[], history: number[], estimated: boolean[], forecast: ForecastResult | null): ChartRow[] {
  const rows: ChartRow[] = [];
  for (let i = 0; i < history.length; i++) {
    const row: ChartRow = { label: labels[i], kind: estimated[i] ? 'est' : 'real' };
    if (estimated[i]) row.est = history[i];
    else row.real = history[i];
    // Điểm chuyển từ ước lượng sang thật: vẽ ở cả hai đường để hai đoạn nối liền nhau
    if (estimated[i] && i + 1 < history.length && !estimated[i + 1]) row.real = history[i];
    rows.push(row);
  }

  if (forecast && rows.length > 0) {
    // Điểm hôm nay cũng là điểm bắt đầu của đường dự báo, để đường nét đứt nối tiếp đường thật
    const last = rows[rows.length - 1];
    const lastValue = history[history.length - 1];
    last.fc = lastValue;
    last.band = [lastValue, lastValue];
    for (const p of forecast.points) {
      rows.push({ label: `+${p.week}t`, fc: p.mid, band: [p.lo, p.hi], kind: 'fc' });
    }
  }
  return rows;
}

function formatValue(value: number, unit: string): string {
  if (unit === 'tr') return `${value.toFixed(1)} tr`;
  return `${Math.round(value)} tin`;
}

// Tooltip tự viết để ghi rõ đây là số thật, ước lượng hay dự báo
function ChartTooltip({ active, payload, unit }: { active?: boolean; payload?: { payload: ChartRow }[]; unit: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;

  let text = '';
  if (row.kind === 'fc' && row.fc !== undefined && row.band) {
    text = `Dự báo: ${formatValue(row.fc, unit)} (khoảng ${formatValue(row.band[0], unit)} – ${formatValue(row.band[1], unit)})`;
  } else if (row.kind === 'est' && row.est !== undefined) {
    text = `Ước lượng: ${formatValue(row.est, unit)}`;
  } else if (row.real !== undefined) {
    text = `Thật: ${formatValue(row.real, unit)}`;
  }

  return (
    <div className="fc-tip">
      <div className="mini">{row.label}</div>
      <b>{text}</b>
    </div>
  );
}

const tick = { fontSize: 11, fill: 'var(--mut)' };

export function ForecastChart({ labels, history, estimated, forecast, unit }: Props) {
  const rows = buildRows(labels, history, estimated, forecast);
  const todayLabel = labels[labels.length - 1];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={rows} margin={{ top: 16, right: 12, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
        <YAxis tick={tick} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<ChartTooltip unit={unit} />} />
        <Area dataKey="band" stroke="none" fill="var(--acc)" fillOpacity={0.15} isAnimationActive={false} connectNulls={false} />
        <Line dataKey="est" stroke="var(--acc)" strokeOpacity={0.45} strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line dataKey="real" stroke="var(--acc)" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line dataKey="fc" stroke="var(--acc)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
        {forecast && <ReferenceLine x={todayLabel} stroke="var(--mut)" strokeDasharray="2 3" label={{ value: 'Hôm nay', position: 'top', fill: 'var(--mut)', fontSize: 11 }} />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
