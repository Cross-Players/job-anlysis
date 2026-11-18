/** Mũi tên và phần trăm thay đổi, xanh khi tăng, cam khi giảm */
export function Delta({ value, digits = 1 }: { value: number; digits?: number }) {
  const up = value >= 0;
  return <span className={`delta ${up ? 'up' : 'dn'}`}>{up ? '▲' : '▼'} {Math.abs(value).toFixed(digits)}%</span>;
}

/** Lương so với nhóm tương đương: ratio 1.12 hiển thị +12% */
export function RatioBadge({ ratio }: { ratio: number }) {
  return <span className={`delta ${ratio >= 1 ? 'up' : 'dn'}`}>{ratio >= 1 ? '+' : '−'}{Math.abs((ratio - 1) * 100).toFixed(0)}%</span>;
}
