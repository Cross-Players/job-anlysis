// Cấu hình crawler, đọc từ biến môi trường. Giá trị mặc định là mức "lịch sự" đã chốt trong
// docs/superpowers/specs/2026-11-09-crawl-pipeline-design.md (mục 5.1).

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} phải là số không âm, nhận được "${raw}"`);
  return value;
}

export interface Config {
  databaseUrl: string;
  sources: string[]; // các nguồn được bật, ví dụ ['vieclam24h']
  delayMs: number; // khoảng nghỉ tối thiểu giữa 2 request tới cùng một nguồn
  jitterMs: number; // cộng thêm ngẫu nhiên 0..jitterMs
  maxFetch: number; // số trang tin tối đa tải trong một lần chạy
  maxConsecutiveErrors: number; // lỗi liên tiếp quá mức này thì dừng nguồn đó
  userAgent: string; // tự giới thiệu là bot, không giả trình duyệt
}

export function loadConfig(): Config {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Thiếu DATABASE_URL');
  return {
    databaseUrl,
    sources: (process.env.CRAWL_SOURCES || 'vieclam24h').split(',').map((s) => s.trim()).filter(Boolean),
    delayMs: num('CRAWL_DELAY_MS', 3000),
    jitterMs: num('CRAWL_JITTER_MS', 2000),
    maxFetch: num('CRAWL_MAX_FETCH', 2000),
    maxConsecutiveErrors: num('CRAWL_MAX_CONSECUTIVE_ERRORS', 5),
    userAgent: process.env.CRAWL_USER_AGENT ?? 'HiringIntelligenceBot/0.1 (+https://jobs-analysis.crosstechedu.com)',
  };
}
