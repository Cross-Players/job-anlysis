// Một lượt quét: với mỗi nguồn được bật
//   1. đọc robots.txt, đọc danh sách tin đang mở (sitemap)
//   2. tin mới → thêm; tin vẫn còn → cập nhật last_seen; tin biến mất → đánh dấu đã đóng
//   3. tải trang chi tiết các tin chưa đọc, lưu các trường đã đọc + bản gốc đã xóa thông tin cá nhân
//   4. ghi kết quả lần quét (độ phủ) vào scan_run
// Bị chặn (403/429/thử thách) thì dừng nguồn đó ngay, không thử lại.
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { loadConfig, type Config } from './config.ts';
import { BlockedError, HttpError, createClient, type Get } from './http.ts';
import { isAllowed, parseRobots } from './robots.ts';
import { SOURCES } from './sources/index.ts';
import type { SourceAdapter } from './sources/types.ts';

// Nếu danh sách mới ít hơn mức này so với số tin đang mở trong DB, coi như sitemap lỗi:
// không đánh dấu đóng hàng loạt.
const MIN_LIST_RATIO = 0.5;

const log = (msg: string, extra: Record<string, unknown> = {}) =>
  console.log(JSON.stringify({ t: new Date().toISOString(), msg, ...extra }));

async function migrate(db: pg.Pool) {
  const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await db.query(sql);
}

interface Counters {
  listed: number;
  new_jobs: number;
  fetched: number;
  failed: number;
  closed: number;
}

async function syncList(db: pg.Pool, source: string, listed: { id: string; url: string }[], c: Counters) {
  const { rows: openRows } = await db.query<{ n: string }>(
    'SELECT count(*) AS n FROM raw_job WHERE source = $1 AND closed_at IS NULL',
    [source],
  );
  const openBefore = Number(openRows[0].n);

  const upsert = await db.query<{ inserted: boolean }>(
    `INSERT INTO raw_job (source, source_id, url)
     SELECT $1, id, url FROM unnest($2::text[], $3::text[]) AS t(id, url)
     ON CONFLICT (source, source_id) DO UPDATE
       SET last_seen = now(), url = EXCLUDED.url,
           closed_at = NULL -- tin xuất hiện lại thì mở lại
     RETURNING (xmax = 0) AS inserted`,
    [source, listed.map((j) => j.id), listed.map((j) => j.url)],
  );
  c.new_jobs = upsert.rows.filter((r) => r.inserted).length;

  if (openBefore > 0 && listed.length < openBefore * MIN_LIST_RATIO) {
    log('Danh sách ngắn bất thường, bỏ qua bước đánh dấu đóng', { source, listed: listed.length, openBefore });
    return;
  }
  const closed = await db.query(
    `UPDATE raw_job SET closed_at = now()
     WHERE source = $1 AND closed_at IS NULL AND NOT (source_id = ANY($2::text[]))`,
    [source, listed.map((j) => j.id)],
  );
  c.closed = closed.rowCount ?? 0;
}

async function fetchPending(db: pg.Pool, adapter: SourceAdapter, get: Get, robots: ReturnType<typeof parseRobots>, cfg: Config, c: Counters) {
  const { rows } = await db.query<{ source_id: string; url: string }>(
    `SELECT source_id, url FROM raw_job
     WHERE source = $1 AND closed_at IS NULL AND fetched_at IS NULL AND fetch_attempts < 3
     ORDER BY first_seen, source_id LIMIT $2`,
    [adapter.name, cfg.maxFetch],
  );
  log('Bắt đầu tải trang tin', { source: adapter.name, pending: rows.length });

  let consecutiveErrors = 0;
  for (const row of rows) {
    if (!isAllowed(robots, row.url)) {
      await db.query(
        `UPDATE raw_job SET fetch_attempts = 3, fetch_error = 'robots.txt không cho phép' WHERE source = $1 AND source_id = $2`,
        [adapter.name, row.source_id],
      );
      continue;
    }

    try {
      const html = await get(row.url);
      const job = adapter.parseJob(html, row.url);
      if (!job) throw new Error('Không tìm thấy JobPosting trong trang');
      await db.query(
        `UPDATE raw_job SET
           fetched_at = now(), fetch_attempts = fetch_attempts + 1, fetch_error = NULL, parser_version = $3,
           in_scope = $4, title = $5, company = $6, regions = $7, cities = $8, date_posted = $9, valid_through = $10,
           skills = $11, employment_type = $12, experience_months = $13, work_mode = $14,
           salary_text = $15, salary_hidden = $16, payload = $17,
           salary_min = $18, salary_max = $19, salary_currency = $20, salary_unit = $21, category = $22
         WHERE source = $1 AND source_id = $2`,
        [
          adapter.name, row.source_id, adapter.parserVersion,
          job.cities.length > 0, job.title, job.company, job.regions, job.cities, job.datePosted, job.validThrough,
          job.skills, job.employmentType, job.experienceMonths, job.workMode,
          job.salaryText, job.salaryHidden, JSON.stringify(job.payload),
          job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryUnit, job.category,
        ],
      );
      c.fetched++;
      consecutiveErrors = 0;
    } catch (err) {
      if (err instanceof BlockedError) throw err;
      c.failed++;
      const message = err instanceof Error ? err.message : String(err);
      const gone = err instanceof HttpError && (err.status === 404 || err.status === 410);
      await db.query(
        `UPDATE raw_job SET fetch_attempts = fetch_attempts + 1, fetch_error = $3,
           closed_at = CASE WHEN $4 THEN now() ELSE closed_at END
         WHERE source = $1 AND source_id = $2`,
        [adapter.name, row.source_id, message.slice(0, 500), gone],
      );
      log('Lỗi tải tin', { source: adapter.name, id: row.source_id, error: message });
      if (!gone && ++consecutiveErrors >= cfg.maxConsecutiveErrors) {
        throw new Error(`Dừng sau ${consecutiveErrors} lỗi liên tiếp`);
      }
    }

    if ((c.fetched + c.failed) % 50 === 0) log('Tiến độ', { source: adapter.name, fetched: c.fetched, failed: c.failed, total: rows.length });
  }
}

async function crawlSource(db: pg.Pool, adapter: SourceAdapter, cfg: Config) {
  const get = createClient({ userAgent: cfg.userAgent, delayMs: cfg.delayMs, jitterMs: cfg.jitterMs });
  const { rows } = await db.query<{ id: string }>('INSERT INTO scan_run (source) VALUES ($1) RETURNING id', [adapter.name]);
  const runId = rows[0].id;
  const c: Counters = { listed: 0, new_jobs: 0, fetched: 0, failed: 0, closed: 0 };
  let status = 'ok';
  let note: string | null = null;

  try {
    let robotsText = '';
    try {
      robotsText = await get(`${adapter.origin}/robots.txt`);
    } catch (err) {
      if (err instanceof BlockedError) throw err;
      if (!(err instanceof HttpError && err.status === 404)) throw err; // không có robots.txt = không cấm
    }
    const robots = parseRobots(robotsText);

    const listed = await adapter.listOpenJobs(get);
    c.listed = listed.length;
    log('Đọc danh sách', { source: adapter.name, listed: listed.length });
    if (listed.length === 0) throw new Error('Danh sách tin rỗng, có thể nguồn đổi cấu trúc');

    await syncList(db, adapter.name, listed, c);
    await fetchPending(db, adapter, get, robots, cfg, c);
  } catch (err) {
    status = err instanceof BlockedError ? 'blocked' : 'error';
    note = err instanceof Error ? err.message : String(err);
    log(status === 'blocked' ? 'Bị chặn, dừng nguồn' : 'Lỗi, dừng nguồn', { source: adapter.name, error: note });
  } finally {
    await db.query(
      `UPDATE scan_run SET finished_at = now(), status = $2, listed = $3, new_jobs = $4, fetched = $5, failed = $6, closed = $7, note = $8
       WHERE id = $1`,
      [runId, status, c.listed, c.new_jobs, c.fetched, c.failed, c.closed, note],
    );
    log('Xong nguồn', { source: adapter.name, status, ...c });
  }
  return status;
}

async function main() {
  const cfg = loadConfig();
  const db = new pg.Pool({ connectionString: cfg.databaseUrl, max: 2 });
  let failed = false;
  try {
    await migrate(db);
    for (const name of cfg.sources) {
      const adapter = SOURCES[name];
      if (!adapter) {
        log('Nguồn không tồn tại, bỏ qua', { source: name });
        continue;
      }
      if ((await crawlSource(db, adapter, cfg)) !== 'ok') failed = true;
    }
  } finally {
    await db.end();
  }
  // Mã thoát khác 0 để systemd ghi nhận lượt chạy có vấn đề
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  log('Lỗi nghiêm trọng', { error: err instanceof Error ? err.stack : String(err) });
  process.exitCode = 2;
});
