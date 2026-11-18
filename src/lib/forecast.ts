// Dự báo 12 tuần tới bằng đường thẳng xu hướng (hồi quy tuyến tính) trên 12 tuần gần nhất.
// ĐÂY LÀ BẢN TẠM ở frontend để có giao diện. Khi có backend Python, phần này sẽ do
// backend tính (thư viện statsmodels, có tính cả mùa vụ như dịp Tết) và trả về cùng kiểu dữ liệu.

export interface ForecastPoint {
  week: number; // 1..12 = số tuần tính từ hôm nay
  mid: number; // giá trị dự báo
  lo: number; // cận dưới vùng không chắc chắn
  hi: number; // cận trên vùng không chắc chắn
}
export type Direction = 'up' | 'flat' | 'down';
export type Confidence = 'high' | 'medium' | 'low';
export interface ForecastResult {
  points: ForecastPoint[];
  changePct: number; // 12 tuần tới so với 12 tuần qua, %
  direction: Direction;
  confidence: Confidence;
  backtestErrorPct: number | null; // "dự báo trước đây sai khoảng ±X%"
}

export const FORECAST_WEEKS = 12;
export const FIT_WEEKS = 12;
export const MIN_HISTORY = 8;
export const DIRECTION_THRESHOLD_PCT = 5;
export const BAND_MULTIPLIER = 1.5;
// Nửa độ rộng vùng mờ chia cho giá trị dự báo: dưới 0.15 là chắc chắn cao, dưới 0.3 là trung bình
export const CONFIDENCE_HIGH = 0.15;
export const CONFIDENCE_MEDIUM = 0.3;

/** Đường thẳng y = intercept + slope × x đi gần các điểm nhất (x = 0, 1, 2, ...) */
export function linearFit(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0;
  let sumY = 0;
  for (let x = 0; x < n; x++) {
    sumX += x;
    sumY += values[x];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Công thức bình phương tối thiểu: slope = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²
  let top = 0;
  let bottom = 0;
  for (let x = 0; x < n; x++) {
    top += (x - meanX) * (values[x] - meanY);
    bottom += (x - meanX) * (x - meanX);
  }
  const slope = bottom === 0 ? 0 : top / bottom;
  return { slope, intercept: meanY - slope * meanX };
}

/** Độ lệch chuẩn của các điểm so với đường thẳng: dữ liệu càng "nhiễu" thì số này càng lớn */
export function residualStd(values: number[], slope: number, intercept: number): number {
  if (values.length === 0) return 0;
  let sumSquares = 0;
  for (let x = 0; x < values.length; x++) {
    const diff = values[x] - (intercept + slope * x);
    sumSquares += diff * diff;
  }
  return Math.sqrt(sumSquares / values.length);
}

/** Kéo dài đường thẳng ra 12 tuần tới, kèm vùng mờ rộng dần theo căn bậc hai số tuần */
function buildPoints(recent: number[]): ForecastPoint[] {
  const { slope, intercept } = linearFit(recent);
  const std = residualStd(recent, slope, intercept);
  const points: ForecastPoint[] = [];
  for (let k = 1; k <= FORECAST_WEEKS; k++) {
    const x = recent.length - 1 + k;
    const mid = Math.max(0, intercept + slope * x);
    const halfBand = BAND_MULTIPLIER * std * Math.sqrt(k);
    points.push({ week: k, mid, lo: Math.max(0, mid - halfBand), hi: mid + halfBand });
  }
  return points;
}

function pickDirection(changePct: number): Direction {
  if (changePct >= DIRECTION_THRESHOLD_PCT) return 'up';
  if (changePct <= -DIRECTION_THRESHOLD_PCT) return 'down';
  return 'flat';
}

function pickConfidence(points: ForecastPoint[]): Confidence {
  let totalRatio = 0;
  for (const p of points) {
    if (p.mid === 0) return 'low'; // dự báo bằng 0 thì không thể nói là chắc chắn
    totalRatio += (p.hi - p.mid) / p.mid;
  }
  const averageRatio = totalRatio / points.length;
  if (averageRatio < CONFIDENCE_HIGH) return 'high';
  if (averageRatio < CONFIDENCE_MEDIUM) return 'medium';
  return 'low';
}

/** Dự báo 12 tuần tới. Trả null nếu lịch sử dưới 8 tuần. */
export function forecastSeries(history: number[]): ForecastResult | null {
  if (history.length < MIN_HISTORY) return null;

  const recent = history.slice(-FIT_WEEKS);
  const points = buildPoints(recent);

  let pastTotal = 0;
  for (const v of recent) pastTotal += v;
  let futureTotal = 0;
  for (const p of points) futureTotal += p.mid;
  const changePct = pastTotal === 0 ? 0 : ((futureTotal - pastTotal) / pastTotal) * 100;

  return {
    points,
    changePct,
    direction: pickDirection(changePct),
    confidence: pickConfidence(points),
    backtestErrorPct: backtestErrorPct(history),
  };
}

/**
 * Tự kiểm tra: giấu `holdout` tuần cuối, dự báo bằng cùng cách, rồi so với số thật.
 * Trả về sai số trung bình theo %, hoặc null nếu không đủ dữ liệu để thử.
 */
export function backtestErrorPct(history: number[], holdout = 4): number | null {
  const train = history.slice(0, history.length - holdout);
  if (train.length < MIN_HISTORY) return null;

  const actual = history.slice(history.length - holdout);
  const predicted = buildPoints(train.slice(-FIT_WEEKS));

  let totalError = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] > 0) {
      totalError += (Math.abs(predicted[i].mid - actual[i]) / actual[i]) * 100;
      count++;
    }
  }
  if (count === 0) return null;
  return totalError / count;
}
