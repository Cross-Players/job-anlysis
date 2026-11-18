export function Sparkline({ data, width = 80, height = 28 }: { data: number[]; width?: number; height?: number }) {
  const mx = Math.max(...data, 1);
  const mn = Math.min(...data);
  const pts = data.map((v, i) => `${(i * (width - 2)) / (data.length - 1) + 1},${height - 3 - ((v - mn) / (mx - mn || 1)) * (height - 6)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width }} aria-hidden>
      <polyline fill="none" stroke="var(--acc)" strokeWidth={2} strokeLinejoin="round" points={pts} />
    </svg>
  );
}
