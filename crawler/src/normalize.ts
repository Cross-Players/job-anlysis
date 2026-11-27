// Chuẩn hóa bằng QUY TẮC (spec mục 6: quy tắc trước, AI sau). Chạy ở bước export, không sửa dữ liệu gốc,
// nên đổi quy tắc chỉ cần export lại, không cần cào lại.
// - Ngành (sector): IT hoặc Chuỗi cung ứng (SCM) theo danh mục nguồn.
// - Nhóm nghề và cấp bậc: theo từ khóa trong chức danh, rồi số tháng kinh nghiệm.
// - Hình thức làm việc: theo từ khóa rõ ràng trong chức danh, mô tả và phúc lợi.
// - Kỹ năng: lấy trường skills của nguồn; nguồn không có thì tìm từ khóa trong chức danh + mô tả.
// - Lương: chỉ quy đổi khi nguồn ghi số rõ ràng. Không có thì để trống, không đoán.
import { fold } from './sources/jsonld.ts';
import type { WorkMode } from './sources/types.ts';

export type Sector = 'it' | 'scm';
export type Level = 'intern' | 'fresher' | 'junior' | 'middle' | 'senior' | 'lead';

export const SECTORS: { id: Sector; name: string }[] = [
  { id: 'it', name: 'IT / Công nghệ' },
  { id: 'scm', name: 'Chuỗi cung ứng (SCM)' },
];

export const IT_GROUPS = [
  { id: 'web', name: 'Phát triển phần mềm / Web', sector: 'it' as const },
  { id: 'mobile', name: 'Mobile', sector: 'it' as const },
  { id: 'data', name: 'Data / AI', sector: 'it' as const },
  { id: 'qa', name: 'QA / Tester', sector: 'it' as const },
  { id: 'devops', name: 'DevOps / Cloud', sector: 'it' as const },
  { id: 'infra', name: 'Hệ thống / Mạng / IT support', sector: 'it' as const },
  { id: 'ba', name: 'BA / PM / Chuyển đổi số', sector: 'it' as const },
  { id: 'erp', name: 'ERP / Triển khai phần mềm', sector: 'it' as const },
  { id: 'embedded', name: 'Nhúng / Phần cứng', sector: 'it' as const },
  { id: 'design', name: 'UI/UX', sector: 'it' as const },
] as const;

export const SCM_GROUPS = [
  { id: 'scm-procurement', name: 'Thu mua / Mua hàng', sector: 'scm' as const },
  { id: 'scm-warehouse', name: 'Kho vận / Tồn kho', sector: 'scm' as const },
  { id: 'scm-import-export', name: 'Xuất nhập khẩu / Hải quan', sector: 'scm' as const },
  { id: 'scm-logistics', name: 'Logistics / Vận tải / Điều phối', sector: 'scm' as const },
  { id: 'scm-planning', name: 'Chuỗi cung ứng / Kế hoạch', sector: 'scm' as const },
] as const;

export const GROUPS = [...IT_GROUPS, ...SCM_GROUPS] as const;
export type GroupId = (typeof GROUPS)[number]['id'];

export const SCM_CATEGORIES = ['thu-mua-kho-van-chuoi-cung-ung', 'xuat-nhap-khau'];

export function sectorOfCategory(category: string | null): Sector {
  return category && SCM_CATEGORIES.includes(category) ? 'scm' : 'it';
}

// Mỗi luật so 3 kiểu, vì tiếng Việt bỏ dấu dễ trùng nhau ("mạng" và "mảng" đều thành "mang",
// "Bà Rịa" thành "ba ria" khớp BA, "ít" thành "it" khớp IT):
// - vi: cụm từ tiếng Việt, so trên chữ CÓ DẤU viết thường
// - en: từ tiếng Anh, so trên chữ đã bỏ dấu (fold) với ranh giới từ ASCII
// - acr: từ viết tắt, so PHÂN BIỆT hoa thường trên chức danh gốc
interface Rule { vi?: string[]; en?: string[]; acr?: string[] }
interface Compiled { vi?: RegExp; en?: RegExp; acr?: RegExp }

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function compile(r: Rule): Compiled {
  return {
    // \b không hiểu chữ có dấu, nên dùng "không đứng sát một chữ cái" (\p{L}) làm ranh giới
    vi: r.vi?.length ? new RegExp(`(?<!\\p{L})(${r.vi.map(escape).join('|')})(?!\\p{L})`, 'u') : undefined,
    en: r.en?.length ? new RegExp(`\\b(${r.en.map(escape).join('|')})\\b`) : undefined,
    acr: r.acr?.length ? new RegExp(`(?<![A-Za-z])(${r.acr.map(escape).join('|')})(?![A-Za-z])`) : undefined,
  };
}
function hit(c: Compiled, title: string): boolean {
  return Boolean(c.vi?.test(title.normalize('NFC').toLowerCase()) || c.en?.test(fold(title)) || c.acr?.test(title));
}

// Việc kinh doanh / văn phòng đăng trong mục IT: luôn loại, kể cả khi có chữ "phần mềm" (nhân viên kinh doanh phần mềm)
const SALES_OFFICE = compile({
  vi: ['kinh doanh', 'bán hàng', 'tư vấn bán hàng', 'tư vấn viên', 'chăm sóc khách hàng', 'kế toán', 'hành chính', 'lễ tân', 'thư ký', 'nhân sự', 'tuyển dụng', 'giao hàng', 'tài xế', 'lái xe', 'cộng tác viên', 'khảo sát', 'kế hoạch'],
  en: ['sales', 'sale', 'telesales', 'telesale', 'marketing', 'mkt', 'content', 'seo'],
  acr: ['CSKH'],
});
// Nghề kỹ thuật không phải IT: loại, TRỪ khi chức danh có từ khóa IT rõ ràng ("máy in hoặc mạng máy tính")
const OTHER_TRADES = compile({
  vi: ['máy nén khí', 'máy photocopy', 'máy in', 'máy phay', 'bê tông', 'xây dựng', 'điện lạnh', 'ô tô', 'cơ khí', 'khóa từ', 'máy chấm công', 'điện nhẹ', 'điện tử', 'camera'],
  en: ['photocopy', 'cnc', 'plc', 'cctv'],
  acr: ['QS'],
});
const STRONG_IT = compile({
  vi: ['phần mềm', 'lập trình viên', 'máy tính', 'mạng máy tính', 'hệ thống mạng', 'quản trị mạng', 'máy chủ', 'công nghệ thông tin', 'mạng'],
  en: ['software', 'developer', 'network', 'server', 'it support', 'helpdesk', 'help desk'],
  acr: ['IT', 'CNTT'],
});

// Thứ tự quan trọng: nhóm cụ thể trước nhóm chung ("Data Engineer" là Data, "Network Engineer" là Hạ tầng).
const GROUP_RULES: [GroupId, Compiled][] = ([
  ['mobile', { en: ['mobile', 'android', 'ios', 'flutter', 'react native', 'kotlin', 'swift'] }],
  ['data', { vi: ['dữ liệu', 'thống kê', 'trí tuệ nhân tạo', 'phân tích số liệu'], en: ['data', 'database', 'dba', 'machine learning', 'deep learning', 'llm', 'big data', 'analytics', 'power bi', 'nlp', 'computer vision'], acr: ['AI', 'ML', 'BI'] }],
  // QA/QC đứng riêng hay là kiểm soát chất lượng sản xuất, nên chỉ nhận khi đi kèm chữ test/kiểm thử
  ['qa', { vi: ['kiểm thử'], en: ['tester', 'testing', 'test', 'automation test', 'qa automation', 'automation qa', 'qa manual', 'manual qa', 'qa tester', 'qc tester', 'software qa', 'qa qc tester'] }],
  ['devops', { en: ['devops', 'site reliability', 'cloud', 'kubernetes', 'platform engineer'], acr: ['SRE'] }],
  ['embedded', { vi: ['nhúng', 'vi điều khiển'], en: ['embedded', 'firmware', 'iot', 'fpga', 'pcb'] }],
  ['ba', { vi: ['phân tích nghiệp vụ', 'quản lý dự án', 'chuyển đổi số'], en: ['business analyst', 'product owner', 'product manager', 'project manager', 'scrum master'], acr: ['BA', 'PO', 'PM'] }],
  ['erp', { vi: ['triển khai phần mềm', 'triển khai hệ thống'], en: ['erp', 'sap', 'odoo', 'crm', 'implementation'] }],
  ['design', { en: ['ui ux', 'product designer'], acr: ['UI', 'UX'] }],
  // Hạ tầng "rõ ràng" trước Web để "Network/System Engineer" không rơi vào Web
  ['infra', { vi: ['quản trị mạng', 'quản trị hệ thống', 'hệ thống mạng', 'mạng máy tính', 'an ninh mạng', 'bảo mật', 'máy chủ', 'hạ tầng'], en: ['network', 'sysadmin', 'system admin', 'system administrator', 'system engineer', 'it support', 'helpdesk', 'help desk', 'security', 'server', 'proxmox', 'vmware'] }],
  ['web', { vi: ['lập trình viên', 'lập trình', 'phần mềm', 'kỹ sư phần mềm'], en: ['developer', 'dev', 'programmer', 'software', 'backend', 'back end', 'frontend', 'front end', 'fullstack', 'full stack', 'web', 'php', 'java', 'net', 'nodejs', 'node js', 'golang', 'python', 'react', 'vue', 'angular', 'laravel', 'wordpress'] }],
  // Ghi chung chung: hỗ trợ IT / mạng / máy tính
  ['infra', { vi: ['hệ thống', 'mạng', 'máy tính', 'tin học', 'công nghệ thông tin', 'viễn thông', 'laptop'], acr: ['IT', 'CNTT'] }],
  ['embedded', { vi: ['phần cứng', 'mạch điện tử'], en: ['hardware'] }],
] as [GroupId, Rule][]).map(([id, r]) => [id, compile(r)]);

// Tin không phải Chuỗi cung ứng đăng trong mục Thu mua - Kho vận / XNK: loại việc bán hàng, visa, nhân sự, tài xế thuần...
const NON_SCM_ROLES = compile({
  vi: ['kinh doanh', 'bán hàng', 'tư vấn bán hàng', 'chăm sóc khách hàng', 'telesales', 'tuyển dụng', 'nhân sự', 'lễ tân', 'thư ký', 'kế toán tổng hợp', 'kế toán thuế', 'kế toán trưởng', 'kế toán nội bộ', 'kế toán công nợ', 'tài xế', 'lái xe', 'giao hàng xe máy', 'giao hàng bằng xe máy', 'bốc xếp', 'bảo vệ', 'tạp vụ', 'hỗ trợ nhà bán'],
  en: ['sales', 'sale', 'telesales', 'telesale', 'marketing', 'visa', 'c&b', 'seller success', 'customer service', 'customer care'],
  acr: ['CSKH'],
});

const SCM_GROUP_RULES: [GroupId, Compiled][] = ([
  ['scm-planning', { vi: ['chuỗi cung ứng', 'kế hoạch cung ứng', 'kế hoạch sản xuất', 'hoạch định', 'điều độ'], en: ['supply chain', 'demand planning', 'supply planning', 'demand planner', 'supply planner', 'planner', 'materials', 's&op'], acr: ['SCM', 'MRP'] }],
  ['scm-procurement', { vi: ['thu mua', 'mua hàng', 'cung ứng', 'tìm nguồn hàng', 'mua sắm'], en: ['procurement', 'purchasing', 'buyer', 'sourcing', 'vendor management', 'merchandiser'] }],
  ['scm-import-export', { vi: ['xuất nhập khẩu', 'hải quan', 'khai báo hải quan', 'thông quan', 'chứng từ'], en: ['import export', 'import', 'export', 'customs', 'documentation'], acr: ['XNK'] }],
  ['scm-warehouse', { vi: ['kho vận', 'quản lý kho', 'giám sát kho', 'trưởng kho', 'phó kho', 'thủ kho', 'kế toán kho', 'kiểm kho', 'kiểm soát kho', 'tồn kho', 'nhập xuất tồn', 'xuất nhập tồn', 'điều phối kho', 'vận hành kho', 'nhân viên kho', 'phụ kho', 'công nhân kho', 'admin kho', 'soạn hàng', 'đóng hàng', 'kho hàng', 'kho bãi', 'kho lạnh', 'hiện trường kho', 'đóng gói', 'xe nâng'], en: ['warehouse', 'inventory', 'stock', 'fulfillment', 'wms', 'forklift'] }],
  ['scm-logistics', { vi: ['điều phối', 'giao nhận', 'vận chuyển', 'vận tải', 'khai thác hàng', 'theo dõi đơn hàng'], en: ['logistics', 'logistic', 'forwarding', 'freight', 'shipping', 'dispatch', 'dispatcher', 'fleet', 'courier', '3pl', 'operation', 'operations', 'order fulfillment'] }],
] as [GroupId, Rule][]).map(([id, r]) => [id, compile(r)]);

/** Có tính là tin IT không: loại việc kinh doanh/văn phòng, và nghề kỹ thuật khác khi không có từ khóa IT rõ ràng */
export function isItRole(title: string): boolean {
  if (hit(SALES_OFFICE, title)) return false;
  if (hit(OTHER_TRADES, title) && !hit(STRONG_IT, title)) return false;
  return true;
}

/** Có tính là tin Chuỗi cung ứng không: loại việc kinh doanh/tài xế/visa/hành chính đăng lẫn */
export function isScmRole(title: string): boolean {
  if (hit(NON_SCM_ROLES, title)) {
    // Lái xe nâng / thủ kho kiêm xe nâng vẫn là việc kho, không phải tài xế đường dài hay bán hàng
    if (/xe nâng/i.test(title) && !/kinh doanh|bán hàng|sales|telesales|tuyển dụng|nhân sự/i.test(title)) return true;
    return false;
  }
  return true;
}

/** Nhóm nghề IT theo chức danh. null = không nhận ra là việc IT (tin bị loại, không đoán theo danh mục nguồn) */
export function groupOf(title: string): GroupId | null {
  for (const [id, rule] of GROUP_RULES) if (hit(rule, title)) return id;
  return null;
}

/** Nhóm nghề Chuỗi cung ứng theo chức danh. null = không nhận ra là việc SCM */
export function scmGroupOf(title: string): GroupId | null {
  for (const [id, rule] of SCM_GROUP_RULES) if (hit(rule, title)) return id;
  return null;
}

const LEVEL_RULES: [Level, RegExp][] = [
  ['intern', /\b(intern|internship|thuc tap|thuc tap sinh)\b/],
  ['fresher', /\b(fresher|moi tot nghiep|moi ra truong|entry level)\b/],
  ['lead', /\b(lead|leader|truong nhom|truong phong|truong bo phan|pho phong|manager|head|giam doc|director|cto|cio|giam sat)\b/],
  ['senior', /\b(senior|sr|chuyen gia|principal|architect|expert)\b/],
  ['junior', /\b(junior|jr)\b/],
  ['middle', /\b(middle|mid level)\b/],
];

export function levelOf(title: string, experienceMonths: number | null): Level | null {
  const t = fold(title);
  for (const [level, re] of LEVEL_RULES) if (re.test(t)) return level;
  if (experienceMonths === null) return null;
  if (experienceMonths <= 0) return 'fresher';
  if (experienceMonths < 24) return 'junior';
  if (experienceMonths < 60) return 'middle';
  return 'senior';
}

const HYBRID_RE = /(?<![a-z/])hybrid(?![a-z/])(?!\s+cloud)|(?<!thời\s+gian\s+)(làm\s+việc|hình\s+thức|mô\s+hình|chế\s+độ)\s+(làm\s+việc\s+)?linh\s+hoạt|(?:\d+\s*(?:ngày|buổi)\s*(?:remote|wfh|từ\s+xa)\s*\/\s*(?:tuần|tháng|năm)|remote(?:\s+\S+){0,4}?\s*\d+%)|(?:kết\s+hợp|linh\s+hoạt).{0,25}(?:remote|wfh|từ\s+xa|online).{0,25}(?:văn\s+phòng|onsite|trực\s+tiếp)/i;
const REMOTE_RE = /\bwork\s*from\s*home\b|\bwfh\b|(?<!\p{L})làm(?:\s+việc)?\s+(?:từ\s+xa|tại\s+nhà(?!\s*(?:máy|xưởng|hàng|kho))|online)(?!\p{L})|\bremote\b/giu;
const REMOTE_FALSE_CTX = /hỗ\s+trợ\s+remote|remote\s+support|qua\s+remote|kết\s+nối\s+remote|điều\s+khiển\s+remote|sửa\s+chữa\s+remote|bảo\s+trì.{0,15}remote|remote\s*\/\s*onsite|onsite\s*\/\s*remote|teamviewer|ultraview|anydesk|cloud|\d+\s*(?:ngày|buổi)|%/i;
const ONSITE_RE = /(?<!trợ\s+cấp\s+|phụ\s+cấp\s+|công\s+tác\s+|remote\/)\b(?:onsite|on-site|in-office)\b|(?<!\p{L})(?:làm(?:\s+việc)?\s+(?:trực\s+tiếp\s+)?tại\s+(?:văn\s+phòng|công\s+ty|kho|xưởng|nhà\s+máy|công\s+trường|chi\s+nhánh|cửa\s+hàng|địa\s+điểm|ngân\s+hàng|khách\s+hàng)|hình\s+thức(?:\s+làm\s+việc)?\s*:?\s*tại\s+văn\s+phòng)(?!\p{L})/iu;

/** Suy luận hình thức làm việc (hybrid / remote / onsite) từ tiêu đề, mô tả và phúc lợi. null = không ghi rõ */
export function workModeOf(text: string): WorkMode | null {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (HYBRID_RE.test(t)) return 'hybrid';
  for (const m of t.matchAll(REMOTE_RE)) {
    const start = Math.max(0, m.index - 35);
    const end = Math.min(t.length, m.index + m[0].length + 35);
    if (!REMOTE_FALSE_CTX.test(t.slice(start, end))) return 'remote';
  }
  if (ONSITE_RE.test(t)) return 'onsite';
  return null;
}

// Kỹ năng chuẩn → mẫu tìm trên văn bản viết thường (giữ ký hiệu như ., #, + nên không dùng fold).
const SKILL_RULES: [string, RegExp][] = [
  ['Java', /\bjava\b(?!\s*script)/],
  ['Spring', /\bspring\s*(boot|framework|mvc)?\b/],
  ['PHP', /\bphp\b/],
  ['Laravel', /\blaravel\b/],
  ['Python', /\bpython\b/],
  ['Django', /\bdjango\b/],
  ['FastAPI', /\bfastapi\b/],
  ['JavaScript', /\bjavascript\b|(?<![\w.])js\b(?![.\w])/], // 'JS' đứng riêng, không phải đuôi .js của Node.js
  ['TypeScript', /\btypescript\b/],
  ['React', /\breact(\.?js)?\b(?!\s*native)/],
  ['Vue', /\bvue(\.?js)?\b/],
  ['Angular', /\bangular(js)?\b/],
  ['Next.js', /\bnext\.?js\b/],
  ['Node.js', /\bnode\.?js\b|\bnodejs\b/],
  ['.NET', /(^|[^\w])\.net\b|\basp\.net\b|\bdotnet\b/],
  ['C#', /(^|[^\w])c#/],
  ['C++', /(^|[^\w])c\+\+/],
  ['Golang', /\bgolang\b|\bgo\s+(lang|developer)\b/],
  ['Ruby', /\bruby\b/],
  ['Kotlin', /\bkotlin\b/],
  ['Swift', /\bswift\b/],
  ['Flutter', /\bflutter\b/],
  ['React Native', /\breact\s*native\b/],
  ['Android', /\bandroid\b/],
  ['iOS', /\bios\b/],
  ['SQL', /\bsql\b/],
  ['MySQL', /\bmysql\b/],
  ['PostgreSQL', /\bpostgres(ql)?\b/],
  ['SQL Server', /\bsql\s*server\b|\bmssql\b/],
  ['Oracle', /\boracle\b/],
  ['MongoDB', /\bmongo(db)?\b/],
  ['Redis', /\bredis\b/],
  ['Kafka', /\bkafka\b/],
  ['Docker', /\bdocker\b/],
  ['Kubernetes', /\bkubernetes\b|\bk8s\b/],
  ['AWS', /\baws\b|\bamazon web services\b/],
  ['Azure', /\bazure\b/],
  ['GCP', /\bgcp\b|\bgoogle cloud\b/],
  ['Linux', /\blinux\b|\bubuntu\b|\bcentos\b/],
  ['Git', /\bgit\b|\bgithub\b|\bgitlab\b/],
  ['CI/CD', /\bci\s*\/\s*cd\b|\bjenkins\b/],
  ['HTML/CSS', /\bhtml5?\b|\bcss3?\b/],
  ['Power BI', /\bpower\s*bi\b/],
  ['Tableau', /\btableau\b/],
  ['Excel', /\bexcel\b/],
  ['Spark', /\bspark\b/],
  ['Machine Learning', /\bmachine learning\b|\bdeep learning\b|\btensorflow\b|\bpytorch\b/],
  ['LLM / GenAI', /\bllms?\b|\bgenai\b|\bgenerative ai\b|\bchatgpt\b|\bopenai\b|\blangchain\b/],
  ['Selenium', /\bselenium\b/],
  ['Automation test', /\bautomation\s*test(ing)?\b|\bauto\s*test\b|\bcypress\b|\bplaywright\b/],
  ['Mạng (Cisco/CCNA)', /\bccn[ap]\b|\bcisco\b|\bmikrotik\b|\bfortigate\b/],
  ['Windows Server', /\bwindows\s*server\b|\bactive directory\b/],
  ['ERP (SAP/Odoo)', /\bsap\b|\bodoo\b|\berp\b/],
];

// Kỹ năng đặc thù cho Chuỗi cung ứng (SCM)
const SCM_SKILL_RULES: [string, RegExp][] = [
  ['Excel', /\bexcel\b/],
  ['ERP (SAP/Odoo)', /\bsap\b|\bodoo\b|\berp\b/],
  ['WMS', /\bwms\b|phần mềm quản lý kho/],
  ['Power BI', /\bpower\s*bi\b/],
  ['SQL', /\bsql\b/],
  ['Tiếng Anh', /tiếng anh|\benglish\b|\btoeic\b|\bielts\b/],
  ['Tiếng Trung', /tiếng trung|tiếng hoa|\bhsk\b|\bchinese\b/],
  ['Tiếng Nhật', /tiếng nhật|\bjlpt\b|\bn[123]\b/],
  ['Xuất nhập khẩu / Hải quan', /hải quan|\bcustoms\b|khai báo hải quan|thông quan|xuất nhập khẩu/],
  ['Incoterms', /\bincoterms?\b/],
  ['Chứng từ XNK', /chứng từ|vận đơn|\bb\/l\b|\bbill of lading\b|\bc\/o\b|\bl\/c\b/],
  ['Thu mua / Đàm phán', /đàm phán|tìm kiếm nhà cung cấp|đánh giá nhà cung cấp|\bsourcing\b|\bprocurement\b|\bpurchasing\b/],
  ['Quản lý tồn kho', /tồn kho|nhập xuất tồn|xuất nhập tồn|kiểm kê|\binventory\b|\bfifo\b|\bfefo\b/],
  ['Kế hoạch cung ứng (MRP)', /\bmrp\b|dự báo nhu cầu|\bdemand planning\b|\bsupply planning\b|kế hoạch sản xuất/],
  ['Logistics / Vận tải', /\blogistics?\b|vận tải|giao nhận|\bforwarding\b|\bfreight\b|\b3pl\b/],
  ['ISO / 5S', /\biso\b|\b5s\b|\bhaccp\b/],
  ['Lean / Six Sigma', /\blean\b|six sigma|\bkaizen\b/],
];

export function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

/** Kỹ năng tìm thấy trong văn bản, theo thứ tự danh sách chuẩn */
export function extractSkills(text: string, sector: Sector = 'it'): string[] {
  const t = text.toLowerCase();
  const rules = sector === 'scm' ? SCM_SKILL_RULES : SKILL_RULES;
  return rules.filter(([, re]) => re.test(t)).map(([name]) => name);
}

/** Map tên kỹ năng của nguồn (ITviec) về tên chuẩn nếu khớp, không khớp thì giữ nguyên */
export function canonicalSkills(raw: string[]): string[] {
  const out: string[] = [];
  for (const s of raw) {
    const found = extractSkills(s);
    for (const name of found.length ? found : [s.trim()]) if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

/** Tỷ giá dùng quy đổi lương USD (VND cho 1 USD). Số cố định, cập nhật tay khi lệch nhiều. */
export const USD_VND = 26_000;

/** Lương quy về triệu VND/tháng. Đơn vị không rõ (giờ, ngày) hoặc số bất thường thì trả null. */
export function monthlyMillions(value: number | null, currency: string | null, unit: string | null): number | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;
  const vnd = (currency ?? 'VND').toUpperCase() === 'USD' ? value * USD_VND : (currency ?? 'VND').toUpperCase() === 'VND' ? value : NaN;
  if (!Number.isFinite(vnd)) return null;
  const u = (unit ?? 'MONTH').toUpperCase();
  const monthly = u === 'MONTH' ? vnd : u === 'YEAR' ? vnd / 12 : NaN;
  if (!Number.isFinite(monthly)) return null;
  const m = Math.round((monthly / 1e6) * 10) / 10;
  return m >= 1 && m <= 500 ? m : null; // ngoài khoảng này gần như chắc là nhập sai
}

/** Mã công ty ổn định theo tên đã bỏ dấu: 'Công ty TNHH ABC' → 'cong-ty-tnhh-abc' */
export function companySlug(name: string): string {
  return fold(name).replace(/\s+/g, '-').slice(0, 80) || 'khong-ro';
}
