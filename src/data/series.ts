// Dữ liệu mẫu 48 tuần cho 18 nhóm nghề (3 ngành × 6 nhóm). Thứ tự tuần: cũ → mới.
// Số được SINH từ bảng thông số bên dưới bằng công thức cố định (không ngẫu nhiên),
// nên mỗi lần tải trang đều ra cùng một kết quả. Khi có backend thì bỏ file này.
import type { GroupSeries, Level, WorkMode } from '@/lib/types';
import { TOTAL_WEEKS } from '@/lib/constants';
import { IND } from './overview';

// Một dòng thông số của một nhóm nghề
interface GroupSpec {
  industry: string;
  name: string;
  baseJobs: number; // số tin mỗi tuần ở tuần thứ 36 (khoảng giữa kỳ này)
  growth: number; // % thay đổi số tin mỗi tuần (âm = đang giảm)
  baseSalary: number; // lương trung vị (triệu VND) ở tuần thứ 36
  salaryGrowth: number; // % thay đổi lương sau mỗi 12 tuần
  p25Ratio: number;
  p75Ratio: number;
  disclosed: number;
  companies: number;
  daysOpen: number;
  newcomer: number; // tỷ lệ tin nhận Intern / Fresher / Junior
  onsite: number; // tỷ lệ tin Onsite
  remote: number; // tỷ lệ tin Remote (phần còn lại là Hybrid)
}

// Có chủ đích: Data (IT) tăng mạnh, Mobile (IT) giảm, Kế toán tổng hợp đi ngang,
// Kế toán trưởng rất ít tin (để thấy "Chưa đủ dữ liệu" khi lọc theo thành phố).
const SPECS: GroupSpec[] = [
  { industry: 'it', name: 'Web', baseJobs: 30, growth: 0.6, baseSalary: 32, salaryGrowth: 1.5, p25Ratio: 0.75, p75Ratio: 1.31, disclosed: 0.9, companies: 140, daysOpen: 28, newcomer: 0.38, onsite: 0.45, remote: 0.2 },
  { industry: 'it', name: 'Data', baseJobs: 20, growth: 2.5, baseSalary: 40, salaryGrowth: 3, p25Ratio: 0.75, p75Ratio: 1.3, disclosed: 0.8, companies: 85, daysOpen: 35, newcomer: 0.42, onsite: 0.4, remote: 0.25 },
  { industry: 'it', name: 'QA', baseJobs: 12.5, growth: 0, baseSalary: 24, salaryGrowth: 0.5, p25Ratio: 0.75, p75Ratio: 1.33, disclosed: 0.8, companies: 70, daysOpen: 24, newcomer: 0.5, onsite: 0.55, remote: 0.1 },
  { industry: 'it', name: 'DevOps', baseJobs: 10, growth: 1.2, baseSalary: 42, salaryGrowth: 2, p25Ratio: 0.76, p75Ratio: 1.31, disclosed: 0.75, companies: 50, daysOpen: 40, newcomer: 0.2, onsite: 0.45, remote: 0.25 },
  { industry: 'it', name: 'Mobile', baseJobs: 7.5, growth: -1.5, baseSalary: 33, salaryGrowth: -0.5, p25Ratio: 0.76, p75Ratio: 1.27, disclosed: 0.78, companies: 40, daysOpen: 30, newcomer: 0.33, onsite: 0.5, remote: 0.15 },
  { industry: 'it', name: 'Khác', baseJobs: 5, growth: 0.2, baseSalary: 20, salaryGrowth: 0, p25Ratio: 0.75, p75Ratio: 1.4, disclosed: 0.35, companies: 30, daysOpen: 26, newcomer: 0.4, onsite: 0.6, remote: 0.1 },
  { industry: 'kt', name: 'Kế toán tổng hợp', baseJobs: 16, growth: 0, baseSalary: 16, salaryGrowth: 1, p25Ratio: 0.75, p75Ratio: 1.31, disclosed: 0.74, companies: 120, daysOpen: 22, newcomer: 0.45, onsite: 0.85, remote: 0.03 },
  { industry: 'kt', name: 'Kế toán thuế', baseJobs: 11, growth: 0.8, baseSalary: 19, salaryGrowth: 1.5, p25Ratio: 0.74, p75Ratio: 1.37, disclosed: 0.75, companies: 85, daysOpen: 25, newcomer: 0.35, onsite: 0.85, remote: 0.03 },
  { industry: 'kt', name: 'Kiểm toán', baseJobs: 7.5, growth: 0.3, baseSalary: 22, salaryGrowth: 1, p25Ratio: 0.68, p75Ratio: 1.45, disclosed: 0.71, companies: 35, daysOpen: 30, newcomer: 0.55, onsite: 0.8, remote: 0.05 },
  { industry: 'kt', name: 'Giá thành / kho', baseJobs: 6, growth: -0.5, baseSalary: 14, salaryGrowth: 0, p25Ratio: 0.71, p75Ratio: 1.29, disclosed: 0.64, companies: 50, daysOpen: 20, newcomer: 0.4, onsite: 0.95, remote: 0.01 },
  { industry: 'kt', name: 'Kế toán trưởng', baseJobs: 3, growth: 0.4, baseSalary: 35, salaryGrowth: 2, p25Ratio: 0.71, p75Ratio: 1.43, disclosed: 0.65, companies: 30, daysOpen: 45, newcomer: 0.02, onsite: 0.9, remote: 0.02 },
  { industry: 'kt', name: 'Khác', baseJobs: 2.5, growth: 0, baseSalary: 12, salaryGrowth: 0, p25Ratio: 0.75, p75Ratio: 1.33, disclosed: 0.4, companies: 20, daysOpen: 21, newcomer: 0.4, onsite: 0.9, remote: 0.02 },
  { industry: 'mk', name: 'Digital', baseJobs: 14, growth: 1, baseSalary: 20, salaryGrowth: 1, p25Ratio: 0.7, p75Ratio: 1.4, disclosed: 0.65, companies: 90, daysOpen: 24, newcomer: 0.4, onsite: 0.6, remote: 0.12 },
  { industry: 'mk', name: 'Content', baseJobs: 10, growth: -0.3, baseSalary: 15, salaryGrowth: 0, p25Ratio: 0.73, p75Ratio: 1.33, disclosed: 0.67, companies: 75, daysOpen: 20, newcomer: 0.5, onsite: 0.5, remote: 0.25 },
  { industry: 'mk', name: 'Brand', baseJobs: 6, growth: -0.8, baseSalary: 24, salaryGrowth: -0.5, p25Ratio: 0.67, p75Ratio: 1.46, disclosed: 0.66, companies: 35, daysOpen: 33, newcomer: 0.25, onsite: 0.7, remote: 0.05 },
  { industry: 'mk', name: 'Social', baseJobs: 5, growth: 1.5, baseSalary: 13, salaryGrowth: 1, p25Ratio: 0.77, p75Ratio: 1.31, disclosed: 0.63, companies: 40, daysOpen: 18, newcomer: 0.6, onsite: 0.45, remote: 0.3 },
  { industry: 'mk', name: 'SEO', baseJobs: 4, growth: 0.5, baseSalary: 18, salaryGrowth: 0.5, p25Ratio: 0.72, p75Ratio: 1.39, disclosed: 0.64, companies: 25, daysOpen: 26, newcomer: 0.45, onsite: 0.4, remote: 0.35 },
  { industry: 'mk', name: 'Khác', baseJobs: 2, growth: 0, baseSalary: 11, salaryGrowth: 0, p25Ratio: 0.73, p75Ratio: 1.36, disclosed: 0.4, companies: 15, daysOpen: 22, newcomer: 0.45, onsite: 0.6, remote: 0.1 },
];

/** Đổi tên tiếng Việt thành đoạn id: 'Giá thành / kho' → 'gia-thanh-kho' */
export function slugify(text: string): string {
  const lower = text.toLowerCase().replace(/đ/g, 'd');
  const noAccent = lower.normalize('NFD').replace(/[̀-ͯ]/g, ''); // bỏ dấu thanh
  const dashed = noAccent.replace(/[^a-z0-9]+/g, '-'); // ký tự lạ → '-'
  return dashed.replace(/^-+|-+$/g, ''); // bỏ '-' thừa ở đầu và cuối
}

// Chia tỷ lệ "nhận người mới" cho Intern / Fresher / Junior theo 0.15 / 0.35 / 0.5,
// phần còn lại chia cho Middle / Senior / Lead theo 0.5 / 0.35 / 0.15.
function buildLevelShare(newcomer: number): Record<Level, number> {
  const rest = 1 - newcomer;
  return {
    intern: newcomer * 0.15,
    fresher: newcomer * 0.35,
    junior: newcomer * 0.5,
    middle: rest * 0.5,
    senior: rest * 0.35,
    lead: rest * 0.15,
  };
}

function buildModeShare(onsite: number, remote: number): Record<WorkMode, number> {
  return { onsite, remote, hybrid: 1 - onsite - remote };
}

// Số tin tuần i: đường xu hướng (base × tăng trưởng) nhân thêm dao động nhỏ ±6% theo hình sin
// để biểu đồ trông tự nhiên. k là thứ tự nhóm, để các nhóm không dao động giống hệt nhau.
function buildWeeklyJobs(spec: GroupSpec, k: number): number[] {
  const weeks: number[] = [];
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const trend = spec.baseJobs * (1 + (spec.growth * (i - 36)) / 100);
    const wave = 1 + 0.06 * Math.sin(i * 0.9 + k);
    weeks.push(Math.max(0, Math.round(trend * wave)));
  }
  return weeks;
}

function buildWeeklySalary(spec: GroupSpec): number[] {
  const weeks: number[] = [];
  for (let i = 0; i < TOTAL_WEEKS; i++) {
    const salary = spec.baseSalary * (1 + ((spec.salaryGrowth / 100) * (i - 36)) / 12);
    weeks.push(Math.round(salary * 10) / 10); // làm tròn 1 chữ số thập phân
  }
  return weeks;
}

function buildGroup(spec: GroupSpec, k: number): GroupSeries {
  return {
    id: `${spec.industry}-${slugify(spec.name)}`,
    industry: spec.industry,
    name: spec.name,
    isOther: spec.name === 'Khác',
    weeklyJobs: buildWeeklyJobs(spec, k),
    weeklySalary: buildWeeklySalary(spec),
    p25Ratio: spec.p25Ratio,
    p75Ratio: spec.p75Ratio,
    disclosed: spec.disclosed,
    companies: spec.companies,
    daysOpen: spec.daysOpen,
    levelShare: buildLevelShare(spec.newcomer),
    modeShare: buildModeShare(spec.onsite, spec.remote),
  };
}

export const GROUP_SERIES: GroupSeries[] = SPECS.map((spec, k) => buildGroup(spec, k));

// ---- Tỷ trọng kỹ năng theo tuần (mô phỏng) ----

export interface SkillSeries {
  name: string;
  weekly: number[]; // % tin có nhắc kỹ năng, 48 tuần
}

/**
 * Chuỗi tỷ trọng 48 tuần cho các kỹ năng của ngành mà nhóm nghề thuộc về.
 * Mức cơ sở lấy từ danh sách kỹ năng của ngành, nhân một hệ số cố định theo nhóm
 * (giống cách TopSkills đang ước tính). Độ dốc mỗi kỹ năng cũng cố định, từ −1,6% đến +1,6% mỗi tuần.
 */
export function skillSeriesOfGroup(groupId: string): SkillSeries[] {
  const group = GROUP_SERIES.find((g) => g.id === groupId);
  if (!group) return [];

  const [, ...skills] = IND[group.industry].sk;
  const groupFactor = 0.75 + (group.id.length % 5) * 0.12;
  const result: SkillSeries[] = [];

  for (const [name, basePct] of skills) {
    const slope = (((name.length * 7 + basePct) % 9) - 4) * 0.4;
    const weekly: number[] = [];
    for (let i = 0; i < TOTAL_WEEKS; i++) {
      const share = basePct * groupFactor * (1 + (slope * (i - 36)) / 100);
      weekly.push(Math.min(95, Math.max(0, share)));
    }
    result.push({ name, weekly });
  }
  return result;
}
