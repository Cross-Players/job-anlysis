import type { City } from '@/lib/types';

/** Ba thành phố trong phạm vi sản phẩm. Tin ở nơi khác bị loại khi nối dữ liệu thật. */
export const CITIES: { key: City; label: string }[] = [
  { key: 'hn', label: 'Hà Nội' },
  { key: 'dn', label: 'Đà Nẵng' },
  { key: 'hcm', label: 'TP.HCM' },
];

/** Tỷ trọng tin theo thành phố trong từng ngành, tổng mỗi ngành = 1. Số mô phỏng. */
export const CITY_SHARE: Record<string, Record<City, number>> = {
  it: { hn: 0.38, dn: 0.12, hcm: 0.5 },
  kt: { hn: 0.4, dn: 0.1, hcm: 0.5 },
  mk: { hn: 0.35, dn: 0.08, hcm: 0.57 },
};

/** Hệ số nhân lên lương so với mặt bằng cả 3 thành phố. Số mô phỏng. */
export const CITY_SALARY_FACTOR: Record<City, number> = { hn: 1.0, dn: 0.88, hcm: 1.06 };
