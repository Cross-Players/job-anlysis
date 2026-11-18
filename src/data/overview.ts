// Thông tin chung của từng ngành: tên, tỷ lệ công ty / tin, và danh sách kỹ năng được nhắc nhiều.
// Số tin và lương theo tuần của từng nhóm nghề nằm ở src/data/series.ts.
import type { Industry } from '@/lib/types';

export const IND: Record<string, Industry> = {
it:{name:'IT',ratio:.4,
 sk:['Kỹ năng công nghệ',['Python',24],['SQL',21],['Java',17],['React',16],['Docker',13],['Node.js',13],['PostgreSQL',12],['Power BI',9],['Airflow',8]]},
kt:{name:'Kế toán',ratio:.55,
 sk:['Phần mềm & nghiệp vụ',['Excel',68],['MISA',41],['Thuế GTGT',33],['Báo cáo tài chính',29],['Hóa đơn điện tử',22],['Tiếng Anh',18],['IFRS',14],['SAP',12],['ACCA / CPA',11]]},
mk:{name:'Marketing',ratio:.38,
 sk:['Công cụ & kỹ năng',['Facebook Ads',31],['Content writing',29],['Google Ads',28],['Canva',26],['SEO',24],['TikTok',19],['GA4',17],['Photoshop',14],['CRM',12]]}};

export const INDUSTRY_KEYS = Object.keys(IND);

/** Kỹ năng phổ biến khi xem tất cả ngành */
export const ALL_SKILLS: Industry['sk'] = ['Kỹ năng phổ biến nhiều ngành', ['Excel', 31], ['Tiếng Anh', 22], ['SQL', 14], ['Python', 12], ['Facebook Ads', 11], ['Canva', 10], ['MISA', 9], ['Giao tiếp', 9], ['React', 8]];
