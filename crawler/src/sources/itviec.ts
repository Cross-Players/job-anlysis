// Adapter ITviec. Kiểm tra cấu trúc ngày 2026-11-21:
// - Danh sách tin đang mở: sitemap https://itviec.com/twinnings_jobs_desc_vn.xml (~590 URL).
//   lastmod của mọi URL giống nhau (sitemap tạo lại mỗi đêm) nên biết tin mới bằng cách so danh sách URL.
// - Trang tin có JSON-LD JobPosting: title, datePosted, validThrough, skills, jobLocation, employmentType,
//   experienceRequirements, hiringOrganization, jobBenefits.
// - Lương bị ẩn khi chưa đăng nhập ("You'll love it" trong baseSalary). Không đoán lương.
// - Hình thức làm việc nằm ở phần đầu trang: <span class='normal-text text-rich-grey ms-1'>Tại văn phòng</span>.
//   Các chỗ khác có cùng chữ là thẻ "việc làm tương tự", không phải của tin đang xem.
import type { Get } from '../http.ts';
import { stripPiiDeep } from '../pii.ts';
import { date, findJobPosting, jobRegions, monthsOfExperience, normalizeCity, str, textOf, type Json } from './jsonld.ts';
import type { City, ListedJob, ParsedJob, SourceAdapter, WorkMode } from './types.ts';

export { normalizeCity };

const SITEMAP_URL = 'https://itviec.com/twinnings_jobs_desc_vn.xml';
const JOB_URL = /^https:\/\/itviec\.com\/viec-lam-it\/([a-z0-9-]+)$/;

export function parseSitemap(xml: string): ListedJob[] {
  const seen = new Map<string, ListedJob>();
  for (const match of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    const url = match[1].replace(/&amp;/g, '&');
    const m = JOB_URL.exec(url);
    if (m && !seen.has(m[1])) seen.set(m[1], { id: m[1], url });
  }
  return [...seen.values()];
}

const WORK_MODES: Record<string, WorkMode> = { 'Tại văn phòng': 'onsite', 'Linh hoạt': 'hybrid', 'Làm từ xa': 'remote' };

function parseWorkMode(html: string): WorkMode | null {
  const m = /<span class=['"]normal-text text-rich-grey ms-1['"]>\s*(Tại văn phòng|Linh hoạt|Làm từ xa)\s*<\/span>/.exec(html);
  return m ? WORK_MODES[m[1]] : null;
}

/** Lương: lấy từ baseSalary nếu có số; nếu không, tìm dòng phúc lợi nhắc lương và có chữ số. */
function findSalaryText(job: Json): string | null {
  const base = job.baseSalary as Json | undefined;
  const value = base && typeof base.value === 'object' ? (base.value as Json) : undefined;
  const candidates = [value?.value, value?.minValue, value?.maxValue].filter((v) => v !== undefined && v !== null);
  if (candidates.some((v) => /\d/.test(String(v)))) {
    const unit = str(value?.unitText) ?? '';
    const currency = str(base?.currency) ?? '';
    return [candidates.join(' - '), currency, unit].filter(Boolean).join(' ');
  }

  const benefits = str(job.jobBenefits);
  if (!benefits) return null;
  for (const li of benefits.split(/<\/li>|<br\s*\/?>|\n/i)) {
    const text = textOf(li);
    if (/lương|salary|thu nhập|income/i.test(text) && /\d/.test(text) && /triệu|tr\b|\$|usd|vnd|đ\b|m\b/i.test(text)) {
      return text.slice(0, 200);
    }
  }
  return null;
}

export function parseJobPage(html: string): ParsedJob | null {
  const job = findJobPosting(html);
  if (!job) return null;
  const title = str(job.title);
  if (!title) return null;

  const regions = jobRegions(job);
  const cities = [...new Set(regions.map(normalizeCity).filter((c): c is City => c !== null))];

  const skillsRaw = job.skills;
  const skills = (Array.isArray(skillsRaw) ? skillsRaw.map(String) : (str(skillsRaw) ?? '').split(','))
    .map((s) => s.trim())
    .filter(Boolean);

  const org = (job.hiringOrganization ?? {}) as Json;

  // Bỏ logo và link ứng tuyển (không cần), xóa thông tin cá nhân trong phần còn lại
  const { potentialAction: _a, ...rest } = job;
  const payload = stripPiiDeep({ ...rest, hiringOrganization: { name: org.name ?? null } });

  return {
    title,
    company: str(org.name),
    regions,
    cities,
    datePosted: date(job.datePosted),
    validThrough: date(job.validThrough),
    skills: [...new Set(skills)],
    employmentType: str(job.employmentType),
    experienceMonths: monthsOfExperience(job),
    workMode: parseWorkMode(html),
    salaryText: findSalaryText(job),
    salaryHidden: html.includes('Đăng nhập để xem mức lương'),
    // ITviec ẩn số lương với khách; chữ lương (nếu có) nằm ở salaryText, tách số ở bước xử lý
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryUnit: null,
    category: null,
    payload,
  };
}

export const itviec: SourceAdapter = {
  name: 'itviec',
  origin: 'https://itviec.com',
  parserVersion: 1,
  async listOpenJobs(get: Get) {
    return parseSitemap(await get(SITEMAP_URL));
  },
  parseJob: parseJobPage,
};
