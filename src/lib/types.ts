export type Role = 'seeker' | 'hr' | 'biz';

/** Phạm vi sản phẩm chỉ gồm 3 thành phố */
export type City = 'hn' | 'dn' | 'hcm';
/** 'all' = tổng của cả 3 thành phố trên */
export type CityFilter = City | 'all';

/** Thông tin chung của một ngành (số tin theo tuần nằm ở GroupSeries) */
export interface Industry {
  name: string;
  ratio: number; // hệ số công ty / tin
  sk: [string, ...[string, number][]]; // [nhãn nhóm kỹ năng, ...[kỹ năng, % tin]]
}

export interface Group {
  id: string;
  name: string;
  jobs: number;
  prev: number;
  p25: number;
  med: number;
  p75: number;
  n: number;
}

export type RawCompany = [string, string, string, string, number, number, number, number, number, [string, number][], string];

export interface Company {
  id: number;
  name: string;
  model: string; // Outsource | Product | Startup | In-house
  dom: string; // lĩnh vực
  size: string;
  weekly: number[]; // tin mới mỗi tuần, 48 tuần (cũ → mới), chưa lọc
  levelShare: Record<Level, number>; // tỷ trọng tin theo cấp bậc, tổng = 1 (mô phỏng)
  modeShare: Record<WorkMode, number>; // tỷ trọng tin theo hình thức, tổng = 1 (mô phỏng)
  w: number[]; // tin mới mỗi tuần trong khung thời gian đang xem (đã lọc)
  j: number; // tin mới trong khung thời gian đang xem
  p: number; // tin mới trong khung thời gian liền trước
  g: number; // % thay đổi
  open: number;
  age: number;
  ratio: number; // lương / nhóm tương đương
  disc: number;
  onsite: number;
  stack: [string, number][];
  ev: string; // nguồn nhãn
  cityShare: Record<City, number>; // tỷ trọng tin theo thành phố, tổng = 1 (mô phỏng)
}

// ---- Bộ lọc dùng chung cho mọi trang ----

/** Cấp bậc của tin tuyển dụng */
export type Level = 'intern' | 'fresher' | 'junior' | 'middle' | 'senior' | 'lead';

/** Hình thức làm việc */
export type WorkMode = 'onsite' | 'hybrid' | 'remote';

/** Khung thời gian xem: số tuần gần nhất */
export type Weeks = 4 | 12 | 24;

/** Toàn bộ bộ lọc đang chọn, truyền vào các hàm tính số liệu */
export interface Filters {
  weeks: Weeks;
  city: CityFilter;
  level: Level | 'all';
  mode: WorkMode | 'all';
}

/** Dữ liệu mẫu 48 tuần của một nhóm nghề (cũ → mới) */
export interface GroupSeries {
  id: string; // duy nhất toàn hệ thống, ví dụ 'it-web'
  industry: string; // 'it' | 'kt' | 'mk'
  name: string; // 'Web'
  isOther: boolean; // nhóm "Khác" không được xếp hạng
  weeklyJobs: number[]; // số tin mới mỗi tuần, 48 phần tử
  weeklySalary: number[]; // lương trung vị mỗi tuần (triệu VND), 48 phần tử
  p25Ratio: number; // P25 = trung vị × p25Ratio
  p75Ratio: number; // P75 = trung vị × p75Ratio
  disclosed: number; // tỷ lệ tin có công khai lương, 0–1
  companies: number; // số công ty khác nhau đang tuyển (12 tuần, cả 3 thành phố)
  daysOpen: number; // số ngày trung bình một tin còn mở
  levelShare: Record<Level, number>; // tỷ trọng theo cấp bậc, tổng = 1
  modeShare: Record<WorkMode, number>; // tỷ trọng theo hình thức, tổng = 1
}
