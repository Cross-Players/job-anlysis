// Xuất số liệu cho dashboard: đọc tin đang mở từ CSDL, chuẩn hóa bằng quy tắc (normalize.ts),
// ghi ra một file JSON mà nginx phục vụ ở /data/snapshot.json. Dashboard tính số tổng hợp từ file này
// ngay trên trình duyệt (khoảng vài trăm tin, nhỏ), nên đổi dữ liệu không cần build lại trang.
//
// Chỉ xuất dữ kiện (chức danh, công ty, thành phố, cấp bậc, kỹ năng, lương, link tin gốc),
// KHÔNG xuất mô tả tin hay thông tin liên hệ (spec mục 4: không đăng lại nội dung tin).
//
// Chạy: docker compose --profile crawler run --rm crawler node src/export.ts
// Kiểu dữ liệu phải khớp src/api/snapshot.ts của dashboard.
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import pg from 'pg';
import {
  canonicalSkills, companySlug, extractSkills, GROUPS, groupOf, htmlToText,
  isItRole, isScmRole, levelOf, monthlyMillions, scmGroupOf, sectorOfCategory, workModeOf,
  type GroupId, type Level, type Sector,
} from './normalize.ts';
import type { City, WorkMode } from './sources/types.ts';

export interface SnapshotJob {
  id: string; // `${nguồn}:${mã tin}`
  source: string;
  url: string;
  title: string;
  company: string;
  companyId: string;
  cities: City[];
  posted: string | null; // YYYY-MM-DD theo nguồn
  firstSeen: string; // YYYY-MM-DD lần đầu crawler thấy tin
  sector: Sector;
  group: GroupId;
  level: Level | null;
  mode: WorkMode | null;
  skills: string[];
  salaryMin: number | null; // triệu VND/tháng
  salaryMax: number | null;
}

export interface SnapshotSource {
  name: string;
  status: string; // trạng thái lần quét gần nhất: ok | blocked | error | running
  lastRunAt: string | null;
  listed: number | null; // số tin nguồn đang mở (mẫu số độ phủ)
  open: number; // số tin đang mở đã đọc được, mọi nơi
}

export interface Snapshot {
  version: 1;
  generatedAt: string;
  trackingSince: string | null; // ngày lượt quét thành công đầu tiên
  groups: { id: string; name: string; sector: Sector }[];
  sources: SnapshotSource[];
  excluded: { outOfScope: number; notIt: number }; // tin đã đọc nhưng không đưa vào số liệu (ngoài 3 thành phố / không khớp ngành)
  jobs: SnapshotJob[];
}

interface Row {
  source: string;
  source_id: string;
  url: string;
  title: string;
  company: string | null;
  cities: City[] | null;
  date_posted: Date | null;
  first_seen: Date;
  skills: string[] | null;
  experience_months: number | null;
  work_mode: WorkMode | null;
  salary_min: string | null;
  salary_max: string | null;
  salary_currency: string | null;
  salary_unit: string | null;
  category: string | null;
  description: string | null;
  benefits?: string | null;
}

const ymd = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

/** null = không khớp ngành IT hoặc SCM (bị loại khỏi số liệu) */
export function toSnapshotJob(r: Row): SnapshotJob | null {
  const sector = sectorOfCategory(r.category);
  const validRole = sector === 'scm' ? isScmRole(r.title) : isItRole(r.title);
  if (!validRole) return null;
  const group = sector === 'scm' ? scmGroupOf(r.title) : groupOf(r.title);
  if (!group) return null;
  const plainDesc = htmlToText(r.description ?? '');
  const plainBenefits = htmlToText(r.benefits ?? '');
  const sourceSkills = canonicalSkills(r.skills ?? []);
  const skills = sourceSkills.length ? sourceSkills : extractSkills(`${r.title} ${plainDesc}`, sector);
  const num = (v: string | null) => (v === null ? null : Number(v));
  let min = monthlyMillions(num(r.salary_min), r.salary_currency, r.salary_unit);
  let max = monthlyMillions(num(r.salary_max), r.salary_currency, r.salary_unit);
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  const company = r.company?.trim() || 'Không rõ';
  const mode = r.work_mode ?? workModeOf(`${r.title} ${plainDesc} ${plainBenefits}`);
  return {
    id: `${r.source}:${r.source_id}`,
    source: r.source,
    url: r.url,
    title: r.title,
    company,
    companyId: companySlug(company),
    cities: r.cities ?? [],
    posted: ymd(r.date_posted),
    firstSeen: ymd(r.first_seen)!,
    sector,
    group,
    level: levelOf(r.title, r.experience_months),
    mode,
    skills,
    salaryMin: min,
    salaryMax: max,
  };
}

export async function buildSnapshot(db: pg.Pool): Promise<Snapshot> {
  const { rows } = await db.query<Row>(
    `SELECT source, source_id, url, title, company, cities, date_posted, first_seen, skills, experience_months,
            work_mode, salary_min, salary_max, salary_currency, salary_unit, category,
            payload->>'description' AS description, payload->>'jobBenefits' AS benefits
     FROM raw_job
     WHERE closed_at IS NULL AND fetched_at IS NOT NULL AND in_scope AND title IS NOT NULL
     ORDER BY source, source_id`,
  );
  const jobs: SnapshotJob[] = [];
  let notIt = 0;
  for (const r of rows) {
    const job = toSnapshotJob(r);
    if (job) jobs.push(job);
    else notIt++;
  }

  const { rows: outRows } = await db.query<{ n: string }>(
    'SELECT count(*) AS n FROM raw_job WHERE closed_at IS NULL AND fetched_at IS NOT NULL AND NOT in_scope',
  );
  const { rows: since } = await db.query<{ d: Date | null }>(`SELECT min(started_at) AS d FROM scan_run WHERE status = 'ok'`);
  const { rows: sourceRows } = await db.query<{ source: string; status: string; finished_at: Date | null; listed: number | null; open: string }>(
    `SELECT DISTINCT ON (s.source) s.source, s.status, s.finished_at, s.listed,
            (SELECT count(*) FROM raw_job j WHERE j.source = s.source AND j.closed_at IS NULL AND j.fetched_at IS NOT NULL) AS open
     FROM scan_run s ORDER BY s.source, s.id DESC`,
  );

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    trackingSince: ymd(since[0]?.d ?? null),
    groups: GROUPS.map((g) => ({ id: g.id, name: g.name, sector: g.sector })),
    sources: sourceRows.map((s) => ({
      name: s.source,
      status: s.status,
      lastRunAt: s.finished_at ? s.finished_at.toISOString() : null,
      listed: s.listed,
      open: Number(s.open),
    })),
    excluded: { outOfScope: Number(outRows[0].n), notIt },
    jobs,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Thiếu DATABASE_URL');
  const out = process.env.EXPORT_PATH || '/data/snapshot.json';
  const db = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const snapshot = await buildSnapshot(db);
    await mkdir(dirname(out), { recursive: true });
    // Ghi file tạm rồi đổi tên: nginx không bao giờ phục vụ file ghi dở
    await writeFile(`${out}.tmp`, JSON.stringify(snapshot));
    await rename(`${out}.tmp`, out);
    console.log(JSON.stringify({ t: new Date().toISOString(), msg: 'Đã xuất snapshot', out, jobs: snapshot.jobs.length, ...snapshot.excluded }));
  } finally {
    await db.end();
  }
}

// Chỉ chạy khi gọi trực tiếp (test import các hàm ở trên)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(JSON.stringify({ t: new Date().toISOString(), msg: 'Lỗi xuất snapshot', error: err instanceof Error ? err.stack : String(err) }));
    process.exitCode = 1;
  });
}
