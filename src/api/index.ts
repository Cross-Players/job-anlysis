// Tầng dữ liệu cho giao diện. Mọi trang lấy số liệu qua các hàm ở đây.
// Nguồn: /data/snapshot.json do crawler xuất mỗi đêm (crawler/src/export.ts), nginx phục vụ tĩnh.
// File nhỏ (vài trăm tin) nên tải một lần cho cả phiên rồi tính tại trình duyệt theo bộ lọc.
import { companyDetail, companyRows, computeOverview, type CompanyDetail, type CompanyRow, type OverviewData } from '@/lib/market';
import type { Filters } from '@/lib/types';
import type { Snapshot } from './snapshot';

export const SNAPSHOT_URL = '/data/snapshot.json';

let cached: Promise<Snapshot> | null = null;

export function getSnapshot(): Promise<Snapshot> {
  if (!cached) {
    cached = fetch(SNAPSHOT_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Chưa có số liệu (HTTP ${res.status})`);
        return res.json() as Promise<Snapshot>;
      })
      .catch((err) => {
        cached = null; // lần sau thử lại
        throw err;
      });
  }
  return cached;
}

export async function getOverview(f: Filters, groupId: string | null): Promise<OverviewData> {
  return computeOverview(await getSnapshot(), f, groupId);
}

export async function getCompanies(f: Filters, skill: string): Promise<CompanyRow[]> {
  return companyRows(await getSnapshot(), f, skill);
}

export async function getCompany(id: string, f: Filters): Promise<CompanyDetail | null> {
  return companyDetail(await getSnapshot(), id, f);
}
