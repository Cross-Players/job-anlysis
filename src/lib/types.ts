/** Ngành tuyển dụng */
export type Sector = 'it' | 'scm';
export type SectorFilter = Sector | 'all';

/** Phạm vi sản phẩm chỉ gồm 3 thành phố */
export type City = 'hn' | 'dn' | 'hcm';
/** 'all' = cả 3 thành phố trên */
export type CityFilter = City | 'all';

/** Cấp bậc của tin tuyển dụng */
export type Level = 'intern' | 'fresher' | 'junior' | 'middle' | 'senior' | 'lead';

/** Hình thức làm việc */
export type WorkMode = 'onsite' | 'hybrid' | 'remote';

/** Bộ lọc dùng chung cho mọi trang, truyền vào các hàm tính số liệu */
export interface Filters {
  sector: SectorFilter;
  city: CityFilter;
  level: Level | 'all';
  mode: WorkMode | 'all';
}
