// Các hàm đọc JSON-LD JobPosting và chuẩn hóa dùng chung cho mọi adapter.
import type { City } from './types.ts';

export type Json = Record<string, unknown>;

/** Bỏ dấu, viết thường: 'Hồ Chí Minh' → 'ho chi minh' */
export function fold(text: string): string {
  return text.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function normalizeCity(region: string): City | null {
  const f = fold(region);
  if (/\b(ha noi|hanoi)\b/.test(f)) return 'hn';
  if (/\b(ho chi minh|hcm|hcmc|sai gon|saigon)\b/.test(f)) return 'hcm';
  if (/\b(da nang|danang)\b/.test(f)) return 'dn';
  return null;
}

export function findJobPosting(html: string): Json | null {
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)) {
    let data: unknown;
    try {
      data = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const items: unknown[] = Array.isArray(data) ? data : [data];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Json;
      if (obj['@type'] === 'JobPosting') return obj;
      const graph = obj['@graph'];
      if (Array.isArray(graph)) {
        const found = graph.find((g) => g && typeof g === 'object' && (g as Json)['@type'] === 'JobPosting');
        if (found) return found as Json;
      }
    }
  }
  return null;
}

export const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);

export const date = (v: unknown): string | null => {
  const s = str(v);
  return s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
};

export function textOf(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Tên tỉnh/thành gốc trong jobLocation, bỏ trùng và bỏ giá trị rỗng kiểu 'Not Available' */
export function jobRegions(job: Json): string[] {
  const locations = Array.isArray(job.jobLocation) ? job.jobLocation : job.jobLocation ? [job.jobLocation] : [];
  const regions: string[] = [];
  for (const loc of locations as Json[]) {
    const address = (loc?.address ?? {}) as Json;
    const region = str(address.addressRegion) ?? str(address.addressLocality);
    if (region && region !== 'Not Available' && !regions.includes(region)) regions.push(region);
  }
  return regions;
}

export function monthsOfExperience(job: Json): number | null {
  const exp = (job.experienceRequirements as Json | undefined)?.monthsOfExperience;
  if (typeof exp === 'number') return exp;
  if (exp === null || exp === undefined || exp === '') return null;
  return Number.isFinite(Number(exp)) ? Number(exp) : null;
}
