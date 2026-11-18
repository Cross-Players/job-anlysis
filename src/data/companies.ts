// Dữ liệu mẫu công ty (tên hư cấu). Mỗi công ty có số tin 48 tuần và tỷ trọng theo
// thành phố, cấp bậc, hình thức làm việc để bộ lọc chung chạy được. Số mô phỏng, cố định.
import type { City, Company, Level, RawCompany, WorkMode } from '@/lib/types';
import { DEFAULT_FILTERS, TOTAL_WEEKS } from '@/lib/constants';
import { companyInFilters } from '@/lib/cities';

/** Lương trung vị theo vị trí (triệu VND/tháng), dùng làm mốc nhóm tương đương */
export const PEER: Record<string, number> = {'Backend Dev':32,'Frontend Dev':28,'QA':20,'Data Engineer':38,'BA':26};

/** [tên, loại hình, lĩnh vực, quy mô, cơ sở tin/tuần, độ dốc, lương vs nhóm TĐ, tỷ lệ công khai lương, % onsite, stack, nguồn nhãn] */
const RAW: RawCompany[] = [
['Nimbus Soft','Outsource','Fintech','500–1000',8,.5,1.12,.81,60,[['Java',72],['Spring',55],['AWS',41],['PostgreSQL',38],['React',30]],'Nhãn từ mô tả công ty và 14 tin'],
['Kiwi Commerce','Product','E-commerce','200–500',6,.3,1.05,.9,20,[['Node.js',64],['React',61],['MongoDB',40],['Docker',35],['Kafka',22]],'Nhãn thủ công'],
['Saigon DataWorks','Product','Dữ liệu / AI','50–200',3,.4,1.2,.95,30,[['Python',80],['SQL',70],['Airflow',52],['Spark',40],['Docker',30]],'Nhãn thủ công'],
['Vina Bank Tech','In-house','Ngân hàng','1000+',5,-.2,1,.45,90,[['Java',68],['Oracle',50],['Spring',49],['Angular',35],['Linux',30]],'Nhãn thủ công'],
['Orbit Studio','Outsource','Game','50–200',4,.1,.92,.6,40,[['Unity',66],['C#',62],['C++',28],['Firebase',25]],'Nhãn tự động, độ tin cậy trung bình'],
['Healix','Startup','Y tế','10–50',2,.2,.98,.7,50,[['Flutter',60],['Python',45],['GCP',40],['PostgreSQL',35]],'Nhãn tự động, độ tin cậy trung bình'],
['Tora Logistics','Product','Logistics','200–500',5,-.35,.9,.5,80,[['PHP',60],['Laravel',55],['MySQL',52],['Vue',36]],'Nhãn thủ công'],
['Kaizen Global','Outsource','Khách hàng Nhật','1000+',9,.1,.88,.35,100,[['Java',60],['.NET',45],['Tiếng Nhật',40],['Oracle',30],['Angular',28]],'Nhãn từ mô tả công ty và 22 tin']];

/** Tỷ trọng tin của từng công ty (theo thứ tự RAW) ở mỗi thành phố, tổng = 1. Số mô phỏng, cố định. */
const CITY_SPLIT: Record<City, number>[] = [
  { hn: 0.45, dn: 0.15, hcm: 0.40 },
  { hn: 0.20, dn: 0.05, hcm: 0.75 },
  { hn: 0.10, dn: 0.10, hcm: 0.80 },
  { hn: 0.60, dn: 0.05, hcm: 0.35 },
  { hn: 0.20, dn: 0.35, hcm: 0.45 },
  { hn: 0.30, dn: 0.20, hcm: 0.50 },
  { hn: 0.35, dn: 0.15, hcm: 0.50 },
  { hn: 0.40, dn: 0.30, hcm: 0.30 },
];

/** Tỷ lệ tin nhận người mới (Intern / Fresher / Junior) của từng công ty, theo thứ tự RAW */
const NEWCOMER_SHARE = [0.3, 0.4, 0.35, 0.25, 0.45, 0.5, 0.3, 0.4];

// Chia giống dữ liệu nhóm nghề: người mới theo 0.15 / 0.35 / 0.5, còn lại theo 0.5 / 0.35 / 0.15
function buildLevelShare(newcomer: number): Record<Level, number> {
  const rest = 1 - newcomer;
  return {
    intern: newcomer * 0.15, fresher: newcomer * 0.35, junior: newcomer * 0.5,
    middle: rest * 0.5, senior: rest * 0.35, lead: rest * 0.15,
  };
}

// % onsite lấy từ RAW; phần còn lại chia 40% Remote, 60% Hybrid
function buildModeShare(onsitePercent: number): Record<WorkMode, number> {
  const onsite = onsitePercent / 100;
  const remote = (1 - onsite) * 0.4;
  return { onsite, remote, hybrid: 1 - onsite - remote };
}

// Tin mỗi tuần: mức cơ sở + độ dốc + dao động hình sin nhỏ. Tuần 36 là mốc giữa kỳ này.
function buildWeekly(base: number, slope: number, k: number): number[] {
  const weeks: number[] = [];
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const value = base + (slope * (i - 36)) / 3 + Math.sin(i * 1.7 + k) * 1.4;
    weeks.push(Math.max(0, Math.round(value)));
  }
  return weeks;
}

function buildCompany(r: RawCompany, k: number): Company {
  const raw: Company = {
    id: k, name: r[0], model: r[1], dom: r[2], size: r[3],
    weekly: buildWeekly(r[4], r[5], k),
    levelShare: buildLevelShare(NEWCOMER_SHARE[k]),
    modeShare: buildModeShare(r[8]),
    w: [], j: 0, p: 0, g: 0, open: 0, // tính lại ngay bên dưới theo bộ lọc mặc định
    age: Math.round(24 + ((k * 5) % 19)),
    ratio: r[6], disc: r[7], onsite: r[8], stack: r[9], ev: r[10], cityShare: CITY_SPLIT[k],
  };
  return companyInFilters(raw, DEFAULT_FILTERS);
}

export const COMPANIES: Company[] = RAW.map((r, k) => buildCompany(r, k));
