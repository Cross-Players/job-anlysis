// Kiểu dữ liệu mà tầng API trả về cho giao diện.
// Đây cũng là "hợp đồng" cho backend Python sau này: backend trả JSON đúng các kiểu này
// thì giao diện không phải sửa gì.
import type { Direction, ForecastResult } from '@/lib/forecast';
import type { OpenJob, PeerRow } from '@/lib/profile';
import type { Company } from '@/lib/types';

export type { OverviewData } from '@/lib/overview';
export type { CareerRow } from '@/lib/ranking';

/** Hồ sơ một công ty theo bộ lọc đang chọn */
export interface CompanyDetail {
  company: Company; // số liệu đã lọc
  peerRows: PeerRow[]; // lương so với vị trí tương đương
  jobs: OpenJob[]; // vị trí đang mở khớp bộ lọc
  thin: boolean; // công ty có rất ít tin ở thành phố đang chọn
}

export interface SkillTrend {
  name: string;
  sharePct: number; // % tin có nhắc kỹ năng, trung bình trong khung thời gian đang xem
  direction: Direction;
}

export type TrendMetric = 'jobs' | 'salary';

/** Dữ liệu cho biểu đồ Xu hướng & Dự báo của một nhóm nghề */
export interface TrendDetail {
  group: { id: string; name: string; industryName: string };
  labels: string[]; // nhãn ngày của từng tuần lịch sử
  history: number[]; // số tin (hoặc lương) từng tuần trong khung thời gian đang xem
  estimated: boolean[]; // tuần nào là "ước lượng" (dựng lại từ quá khứ)
  forecast: ForecastResult | null; // null nếu chưa đủ dữ liệu
  enoughData: boolean; // 12 tuần gần nhất có đủ MIN_SAMPLE tin để đánh giá xu hướng
  skills: SkillTrend[];
}
