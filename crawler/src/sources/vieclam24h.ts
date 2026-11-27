// Adapter Vieclam24h. Kiểm tra cấu trúc ngày 2026-11-22 (từ IP VPS, User-Agent của bot):
// - robots.txt cho phép trang tin, khai báo sitemap-index.xml. Điều khoản sử dụng (đọc toàn văn
//   /dieu-khoan-su-dung.html) không có điều cấm thu thập tự động; chỉ công khai số tổng hợp.
// - Danh sách tin đang mở: sitemap-index → daily/job-N.xml → job/tintuyendung-N.xml (~18.000 tin mọi ngành).
//   URL tin: https://vieclam24h.vn/{danh-muc}/{slug}-c{nghề}p{tỉnh}id{mã}.html
//   Lấy danh mục IT (IT_CATEGORIES) và Chuỗi cung ứng (SCM_CATEGORIES); các ngành khác không tải.
// - Trang tin có JSON-LD JobPosting: title, datePosted, jobLocation, hiringOrganization,
//   experienceRequirements, employmentType, baseSalary (minValue/maxValue bằng số, VND/MONTH).
//   validThrough không đáng tin (có tin ghi năm trước) nên không dùng.
// - Trang còn có __NEXT_DATA__ chứa tên, email, SĐT người liên hệ: KHÔNG đọc, KHÔNG lưu.
//   Chỉ lấy province_ids từ đó (mã tỉnh, bổ sung khi jobLocation thiếu).
// - Không có trường kỹ năng hay hình thức làm việc có cấu trúc: kỹ năng và hình thức suy ra từ mô tả/phúc lợi.
import type { Get } from '../http.ts';
import { htmlToText, SCM_CATEGORIES, workModeOf } from '../normalize.ts';
import { stripPiiDeep } from '../pii.ts';
import { date, findJobPosting, jobRegions, monthsOfExperience, normalizeCity, str, type Json } from './jsonld.ts';
import type { City, ListedJob, ParsedJob, SourceAdapter } from './types.ts';

const ORIGIN = 'https://vieclam24h.vn';
const SITEMAP_INDEX = `${ORIGIN}/file/sitemap/sitemap-index.xml`;

export const IT_CATEGORIES = ['it-phan-mem', 'it-phan-cung-mang', 'phan-tich-thong-ke-du-lieu'];
export const CRAWL_CATEGORIES = [...IT_CATEGORIES, ...SCM_CATEGORIES];

const JOB_URL = /^https:\/\/vieclam24h\.vn\/([a-z0-9-]+)\/[a-z0-9-]+-c\d+p\d+id(\d+)\.html$/;

// Mã tỉnh của Vieclam24h: mã cũ (trước sáp nhập tỉnh 2025) và mã mới. Lấy từ sitemap tinhthanh(-v2).
const PROVINCE_CITY: Record<string, City> = {
  '73': 'hn', '210000160': 'hn',
  '122': 'hcm', '210000187': 'hcm',
  '104': 'dn', '210000180': 'dn',
};

const locs = (xml: string) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));

/** Tin thuộc danh mục cần thu thập trong một sitemap tin, bỏ trùng theo mã tin */
export function parseJobSitemap(xml: string, categories = CRAWL_CATEGORIES): ListedJob[] {
  const seen = new Map<string, ListedJob>();
  for (const url of locs(xml)) {
    const m = JOB_URL.exec(url);
    if (m && categories.includes(m[1]) && !seen.has(m[2])) seen.set(m[2], { id: m[2], url });
  }
  return [...seen.values()];
}

export function categoryOf(url: string): string | null {
  const m = JOB_URL.exec(url);
  return m ? m[1] : null;
}

function provinceCities(html: string): City[] {
  const m = /"province_ids"\s*:\s*\[([\d,\s"]*)\]/.exec(html);
  if (!m) return [];
  const ids = m[1].split(',').map((s) => s.replace(/["\s]/g, '')).filter(Boolean);
  return ids.map((id) => PROVINCE_CITY[id]).filter((c): c is City => c !== undefined);
}

function salaryOf(job: Json) {
  const base = job.baseSalary as Json | undefined;
  const value = base && typeof base.value === 'object' && base.value ? (base.value as Json) : undefined;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
  const min = num(value?.minValue) ?? num(value?.value);
  const max = num(value?.maxValue) ?? num(value?.value);
  if (min === null && max === null) return { min: null, max: null, currency: null, unit: null, text: null };
  const currency = str(base?.currency);
  const unit = str(value?.unitText);
  const text = [[min, max].filter((v) => v !== null).join(' - '), currency, unit].filter(Boolean).join(' ');
  return { min, max, currency, unit, text };
}

export function parseJobPage(html: string, url: string): ParsedJob | null {
  const job = findJobPosting(html);
  if (!job) return null;
  const title = str(job.title);
  if (!title) return null;

  const regions = jobRegions(job);
  const cities = [...new Set([...regions.map(normalizeCity), ...provinceCities(html)].filter((c): c is City => c !== null))];
  const org = (job.hiringOrganization ?? {}) as Json;
  const salary = salaryOf(job);
  const modeText = `${title} ${htmlToText(str(job.description) ?? '')} ${htmlToText(str(job.jobBenefits) ?? '')}`;

  // Chỉ giữ các trường cần cho xử lý sau (mô tả để suy kỹ năng và hình thức làm việc). Bỏ logo, link công ty, mã định danh.
  const payload = stripPiiDeep({
    title: job.title,
    description: job.description ?? null,
    qualifications: job.qualifications ?? null,
    industry: job.industry ?? null,
    occupationalCategory: job.occupationalCategory ?? null,
    jobBenefits: job.jobBenefits ?? null,
    datePosted: job.datePosted ?? null,
    employmentType: job.employmentType ?? null,
    experienceRequirements: job.experienceRequirements ?? null,
    jobLocation: regions,
    baseSalary: job.baseSalary ?? null,
    hiringOrganization: { name: org.name ?? null },
  });

  return {
    title,
    company: str(org.name),
    regions,
    cities,
    datePosted: date(job.datePosted),
    validThrough: null,
    skills: [],
    employmentType: str(job.employmentType),
    experienceMonths: monthsOfExperience(job),
    workMode: workModeOf(modeText),
    salaryText: salary.text,
    salaryHidden: false,
    salaryMin: salary.min,
    salaryMax: salary.max,
    salaryCurrency: salary.currency,
    salaryUnit: salary.unit,
    category: categoryOf(url),
    payload,
  };
}

export const vieclam24h: SourceAdapter = {
  name: 'vieclam24h',
  origin: ORIGIN,
  parserVersion: 1,
  async listOpenJobs(get: Get) {
    // sitemap-index → daily/job-N.xml → job/tintuyendung-N.xml
    const daily = locs(await get(SITEMAP_INDEX)).filter((u) => /\/daily\/job-\d+\.xml$/.test(u));
    if (daily.length === 0) throw new Error('Không thấy sitemap tin (daily/job-N.xml) trong sitemap-index');
    const parts: string[] = [];
    for (const u of daily) parts.push(...locs(await get(u)).filter((x) => /\/job\/tintuyendung-\d+\.xml$/.test(x)));
    if (parts.length === 0) throw new Error('Không thấy sitemap tintuyendung-N.xml');

    const seen = new Map<string, ListedJob>();
    for (const u of parts) for (const j of parseJobSitemap(await get(u))) if (!seen.has(j.id)) seen.set(j.id, j);
    return [...seen.values()];
  },
  parseJob: parseJobPage,
};
