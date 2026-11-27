// Giao diện chung cho mỗi nguồn (adapter). Thêm nguồn mới = thêm một file trong sources/
// và đăng ký trong sources/index.ts, không đụng phần còn lại.
import type { Get } from '../http.ts';

export type City = 'hn' | 'dn' | 'hcm';
export type WorkMode = 'onsite' | 'hybrid' | 'remote';

export interface ListedJob {
  id: string; // mã tin trên nguồn, ổn định giữa các lần quét
  url: string;
}

export interface ParsedJob {
  title: string;
  company: string | null;
  regions: string[]; // tên tỉnh/thành gốc trên trang
  cities: City[]; // đã chuẩn hóa, chỉ 3 thành phố trong phạm vi
  datePosted: string | null; // YYYY-MM-DD
  validThrough: string | null;
  skills: string[];
  employmentType: string | null;
  experienceMonths: number | null;
  workMode: WorkMode | null;
  salaryText: string | null; // chữ lương tìm thấy, chưa tách số (bước xử lý làm sau)
  salaryHidden: boolean; // trang ẩn lương với khách chưa đăng nhập
  // Lương dạng số khi nguồn ghi rõ (baseSalary có minValue/maxValue). Không có thì null, không đoán.
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null; // 'VND' | 'USD'
  salaryUnit: string | null; // 'MONTH' | 'YEAR' | 'HOUR'...
  category: string | null; // danh mục nghề trên nguồn (ví dụ 'it-phan-mem'), null nếu nguồn chỉ có IT
  payload: unknown; // dữ liệu có cấu trúc gốc, đã xóa thông tin cá nhân
}

export interface SourceAdapter {
  name: string;
  origin: string; // https://domain, để đọc robots.txt
  parserVersion: number; // tăng khi đổi cách đọc, để biết bản ghi nào cần đọc lại
  listOpenJobs(get: Get): Promise<ListedJob[]>;
  parseJob(html: string, url: string): ParsedJob | null;
}
