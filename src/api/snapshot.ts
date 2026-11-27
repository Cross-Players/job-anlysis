// Kiểu của /data/snapshot.json, file crawler xuất mỗi đêm (crawler/src/export.ts).
// Hai bên phải khớp nhau: đổi ở đây thì đổi cả crawler/src/export.ts.
import type { City, Level, Sector, WorkMode } from '@/lib/types';

export interface SnapshotJob {
  id: string; // `${nguồn}:${mã tin}`
  source: string;
  url: string; // link tin gốc
  title: string;
  company: string;
  companyId: string;
  cities: City[];
  posted: string | null; // YYYY-MM-DD theo nguồn
  firstSeen: string; // YYYY-MM-DD lần đầu crawler thấy tin
  sector?: Sector; // mặc định 'it' nếu snapshot cũ chưa có
  group: string; // mã nhóm nghề, xem Snapshot.groups
  level: Level | null; // null = tin không ghi rõ
  mode: WorkMode | null; // null = tin không ghi rõ
  skills: string[];
  salaryMin: number | null; // triệu VND/tháng, null = không công khai
  salaryMax: number | null;
}

export interface SnapshotSource {
  name: string;
  status: string; // lần quét gần nhất: ok | blocked | error | running
  lastRunAt: string | null;
  listed: number | null; // số tin nguồn đang mở
  open: number; // số tin đang mở đã đọc được (mọi nơi)
}

export interface Snapshot {
  version: 1;
  generatedAt: string;
  trackingSince: string | null;
  groups: { id: string; name: string; sector?: Sector }[];
  sources: SnapshotSource[];
  excluded: { outOfScope: number; notIt: number };
  jobs: SnapshotJob[];
}
