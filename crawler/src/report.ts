// Báo cáo nhanh từ dữ liệu đã cào, để kiểm tra bằng mắt trước khi nối dashboard.
// Chạy: docker compose --profile crawler run --rm crawler node src/report.ts
import pg from 'pg';

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const q = async (sql: string) => (await db.query(sql)).rows;

const OPEN = `closed_at IS NULL AND fetched_at IS NOT NULL AND in_scope`;

try {
  console.log('\n== Lần quét gần nhất');
  console.table(await q(`SELECT id, source, status, listed, new_jobs, fetched, failed, closed,
      round(100.0 * fetched / nullif(listed, 0)) AS "phủ %", to_char(started_at, 'YYYY-MM-DD HH24:MI') AS started,
      round(extract(epoch FROM finished_at - started_at) / 60) AS "phút", note
    FROM scan_run ORDER BY id DESC LIMIT 5`));

  console.log('\n== Tổng quan tin đang mở (đã đọc, trong 3 thành phố)');
  console.table(await q(`SELECT count(*) AS tin, count(DISTINCT company) AS cong_ty,
      round(100.0 * avg((salary_text IS NOT NULL)::int)) AS "có chữ lương %",
      round(100.0 * avg(salary_hidden::int)) AS "lương bị ẩn %",
      (SELECT count(*) FROM raw_job WHERE fetched_at IS NOT NULL AND NOT in_scope) AS ngoai_pham_vi
    FROM raw_job WHERE ${OPEN}`));

  console.log('\n== Theo thành phố (một tin có thể ở nhiều nơi)');
  console.table(await q(`SELECT c AS city, count(*) AS tin FROM raw_job, unnest(cities) c WHERE ${OPEN} GROUP BY c ORDER BY 2 DESC`));

  console.log('\n== Hình thức làm việc');
  console.table(await q(`SELECT coalesce(work_mode, '(không rõ)') AS mode, count(*) AS tin FROM raw_job WHERE ${OPEN} GROUP BY 1 ORDER BY 2 DESC`));

  console.log('\n== Kinh nghiệm yêu cầu');
  console.table(await q(`SELECT CASE WHEN experience_months IS NULL THEN '(không rõ)'
        WHEN experience_months < 12 THEN '< 1 năm' WHEN experience_months < 36 THEN '1–3 năm'
        WHEN experience_months < 60 THEN '3–5 năm' ELSE '≥ 5 năm' END AS kinh_nghiem, count(*) AS tin
    FROM raw_job WHERE ${OPEN} GROUP BY 1 ORDER BY 2 DESC`));

  console.log('\n== Top 20 kỹ năng');
  console.table(await q(`SELECT s AS skill, count(*) AS tin,
      round(100.0 * count(*) / (SELECT count(*) FROM raw_job WHERE ${OPEN})) AS "%"
    FROM raw_job, unnest(skills) s WHERE ${OPEN} GROUP BY s ORDER BY 2 DESC LIMIT 20`));

  console.log('\n== Tin mới theo tuần đăng (ước lượng: chỉ gồm tin còn mở)');
  console.table(await q(`SELECT to_char(date_trunc('week', date_posted), 'YYYY-MM-DD') AS tuan, count(*) AS tin
    FROM raw_job WHERE ${OPEN} AND date_posted IS NOT NULL GROUP BY 1 ORDER BY 1 DESC LIMIT 12`));

  console.log('\n== Top 10 công ty đang tuyển');
  console.table(await q(`SELECT company, count(*) AS tin FROM raw_job WHERE ${OPEN} GROUP BY 1 ORDER BY 2 DESC LIMIT 10`));
} finally {
  await db.end();
}
