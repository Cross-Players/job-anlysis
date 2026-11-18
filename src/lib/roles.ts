import type { Company, Role } from './types';

export const ROLES: { key: Role; label: string }[] = [
  { key: 'seeker', label: 'Người tìm việc' },
  { key: 'hr', label: 'HR / Nhà tuyển dụng' },
  { key: 'biz', label: 'Kinh doanh' },
];

export type SortKey = 'name' | 'j' | 'g' | 'ratio' | 'disc';

/** Mỗi vai trò: cột nổi bật, sắp xếp mặc định, gợi ý và thứ tự khối trong hồ sơ */
export const ROLE_CONFIG: Record<Role, { hl: SortKey; tip: string; order: ProfileSection[] }> = {
  seeker: { hl: 'ratio', tip: 'lương so với vị trí tương đương, mức minh bạch và hình thức làm việc.', order: ['kpi', 'sal', 'jobs', 'stack', 'trend'] },
  hr: { hl: 'j', tip: 'quy mô tuyển dụng và mức lương đối thủ trả cho cùng vị trí.', order: ['kpi', 'sal', 'stack', 'trend', 'jobs'] },
  biz: { hl: 'g', tip: 'công ty đang mở rộng, stack và lĩnh vực để chọn khách hàng tiềm năng.', order: ['kpi', 'trend', 'stack', 'jobs', 'sal'] },
};
export type ProfileSection = 'kpi' | 'trend' | 'stack' | 'sal' | 'jobs';

export function roleSummary(c: Company, role: Role, statusLabel: string): string {
  const diff = Math.abs((c.ratio - 1) * 100).toFixed(0);
  if (role === 'seeker') return `Lương ${c.ratio >= 1 ? 'cao hơn' : 'thấp hơn'} nhóm tương đương khoảng ${diff}%, ${Math.round(c.disc * 100)}% tin công khai lương, ${c.onsite}% tin yêu cầu onsite.`;
  if (role === 'hr') return `Đối thủ này ${c.ratio >= 1 ? 'trả cao hơn' : 'trả thấp hơn'} mặt bằng ${diff}% và đang tuyển ${c.open} vị trí, nhiều nhất ở stack ${c.stack[0][0]}.`;
  const g = c.j < 6 ? 'chưa đủ dữ liệu' : `${c.g >= 0 ? '+' : ''}${c.g.toFixed(0)}%`;
  return `${c.model} thuộc lĩnh vực ${c.dom}, ${statusLabel.toLowerCase()} (${g}), đang tìm người cho ${c.stack.slice(0, 2).map((x) => x[0]).join(' và ')}.`;
}
