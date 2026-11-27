import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalSkills, companySlug, extractSkills, groupOf, isItRole, isScmRole, levelOf, monthlyMillions, scmGroupOf, workModeOf } from '../src/normalize.ts';
import { toSnapshotJob } from '../src/export.ts';

test('groupOf: nhóm cụ thể thắng nhóm chung', () => {
  assert.equal(groupOf('Data Engineer (Python, Spark)'), 'data');
  assert.equal(groupOf('Lập Trình Viên Backend (PHP, Node.Js)'), 'web');
  assert.equal(groupOf('Junior Fullstack Developer'), 'web');
  assert.equal(groupOf('Network Engineer'), 'infra');
  assert.equal(groupOf('Kỹ Sư Hệ Thống Mạng – Cctv – Server'), 'infra');
  assert.equal(groupOf('QA Automation Engineer'), 'qa');
  assert.equal(groupOf('Flutter Developer'), 'mobile');
  assert.equal(groupOf('DevOps Engineer (AWS)'), 'devops');
  assert.equal(groupOf('Chuyên Viên AI & Chuyển Đổi Số'), 'data');
  assert.equal(groupOf('Kỹ Thuật Viên Máy Tính'), 'infra');
  assert.equal(groupOf('Nhân Viên IT Dịch Vụ (Help Desk)'), 'infra');
  assert.equal(groupOf('Kỹ Sư Thiết Kế Pcb (Hardware Engineer)'), 'embedded');
  assert.equal(groupOf('Senior Database Engineer / SQL Server DBA'), 'data');
});

test('groupOf: từ viết tắt chỉ khớp khi viết hoa; chữ tiếng Việt so có dấu', () => {
  assert.equal(groupOf('Business Analyst (BA)'), 'ba');
  assert.equal(groupOf('Kỹ thuật viên đi làm ngay Bà Rịa'), null);
  assert.equal(groupOf('Nhân viên ít kinh nghiệm'), null);
  assert.equal(groupOf('Chuyên Viên Kiểm Soát Khối Lượng Mảng Bê Tông'), null); // "mảng" không phải "mạng"
  assert.equal(groupOf('Nhân Viên QA Admin'), null); // QA đứng riêng: không chắc là kiểm thử phần mềm
  assert.equal(groupOf('Nhân Viên Kỹ Thuật'), null); // quá chung chung, không đoán
});

test('isItRole loại việc kinh doanh / văn phòng và nghề kỹ thuật khác', () => {
  assert.equal(isItRole('Nhân Viên Kinh Doanh Phần Mềm'), false);
  assert.equal(isItRole('Telesales'), false);
  assert.equal(isItRole('Kế toán kiêm IT'), false);
  assert.equal(isItRole('Cộng Tác Viên Khảo Sát Doanh Nghiệp'), false);
  assert.equal(isItRole('Nhân Viên Lập Trình Gia Công Máy Phay Mài CNC'), false);
  assert.equal(isItRole('Kỹ Thuật Viên Lắp Đặt Camera'), false);
  assert.equal(isItRole('Kỹ Thuật Viên Sửa Chữa Máy Photocopy / Máy In'), false);
  // Nghề khác nhưng có từ khóa IT rõ ràng thì giữ
  assert.equal(isItRole('Kỹ Thuật Viên Máy In Hoặc Mạng Máy Tính'), true);
  assert.equal(isItRole('Kỹ Thuật Viên IT Lắp Đặt (Máy Tính – Mạng – Camera)'), true);
  assert.equal(isItRole('Lập trình viên Java'), true);
  assert.equal(isItRole('IT Helpdesk'), true);
});

test('levelOf: chức danh trước, rồi số tháng kinh nghiệm, không có thì null', () => {
  assert.equal(levelOf('Thực tập sinh Lập trình', 0), 'intern');
  assert.equal(levelOf('Senior Java Developer', 12), 'senior');
  assert.equal(levelOf('Team Lead Backend', null), 'lead');
  assert.equal(levelOf('Lập trình viên', 0), 'fresher');
  assert.equal(levelOf('Lập trình viên', 12), 'junior');
  assert.equal(levelOf('Lập trình viên', 36), 'middle');
  assert.equal(levelOf('Lập trình viên', 72), 'senior');
  assert.equal(levelOf('Lập trình viên', null), null);
});

test('extractSkills nhận đúng ký hiệu, không nhầm Java với JavaScript, React với React Native', () => {
  assert.deepEqual(extractSkills('JavaScript, React Native, C#, .NET Core'), ['JavaScript', '.NET', 'C#', 'React Native']);
  assert.deepEqual(extractSkills('java spring boot, ReactJS, node.js, postgres'), ['Java', 'Spring', 'React', 'Node.js', 'PostgreSQL']);
  assert.deepEqual(extractSkills('Không yêu cầu gì đặc biệt'), []);
});

test('canonicalSkills gộp cách viết về tên chuẩn, giữ kỹ năng lạ', () => {
  assert.deepEqual(canonicalSkills(['ReactJS', 'React.js', 'Figma']), ['React', 'Figma']);
});

test('monthlyMillions: quy đổi về triệu VND/tháng, bỏ đơn vị lạ và số bất thường', () => {
  assert.equal(monthlyMillions(25_000_000, 'VND', 'MONTH'), 25);
  assert.equal(monthlyMillions(2000, 'USD', 'MONTH'), 52);
  assert.equal(monthlyMillions(240_000_000, 'VND', 'YEAR'), 20);
  assert.equal(monthlyMillions(50_000, 'VND', 'HOUR'), null);
  assert.equal(monthlyMillions(1000, 'VND', 'MONTH'), null);
  assert.equal(monthlyMillions(null, 'VND', 'MONTH'), null);
});

test('companySlug ổn định theo tên bỏ dấu', () => {
  assert.equal(companySlug('Công Ty TNHH Đất Việt'), 'cong-ty-tnhh-dat-viet');
  assert.equal(companySlug('  '), 'khong-ro');
});

test('toSnapshotJob: kỹ năng suy từ mô tả khi nguồn không có, không xuất mô tả', () => {
  const job = toSnapshotJob({
    source: 'vieclam24h', source_id: '1', url: 'https://vieclam24h.vn/it-phan-mem/x-c8p73id1.html',
    title: 'Lập trình viên Backend', company: 'Công ty Mẫu', cities: ['hn'],
    date_posted: new Date('2026-11-19T00:00:00Z'), first_seen: new Date('2026-11-22T11:00:00Z'),
    skills: [], experience_months: 24, work_mode: null,
    salary_min: '35000000', salary_max: '25000000', salary_currency: 'VND', salary_unit: 'MONTH',
    category: 'it-phan-mem', description: '<p>Yêu cầu: <b>Node.js</b>, MySQL, Docker</p>',
  })!;
  assert.deepEqual(job.skills, ['Node.js', 'MySQL', 'Docker']);
  assert.equal(job.group, 'web');
  assert.equal(job.level, 'middle');
  assert.equal(job.salaryMin, 25);
  assert.equal(job.salaryMax, 35);
  assert.equal(job.companyId, 'cong-ty-mau');
  assert.equal(job.posted, '2026-11-19');
  assert.ok(!('description' in job));
});

test('toSnapshotJob trả null cho tin không phải IT', () => {
  const base = {
    source: 'vieclam24h', source_id: '2', url: 'https://vieclam24h.vn/x', company: 'A', cities: ['hn' as const],
    date_posted: null, first_seen: new Date(), skills: [], experience_months: null, work_mode: null,
    salary_min: null, salary_max: null, salary_currency: null, salary_unit: null, category: 'it-phan-cung-mang', description: null,
  };
  assert.equal(toSnapshotJob({ ...base, title: 'Nhân Viên Kinh Doanh Phần Mềm' }), null);
  assert.equal(toSnapshotJob({ ...base, title: 'Nhân Viên Kỹ Thuật' }), null);
  assert.equal(toSnapshotJob({ ...base, title: 'Nhân Viên IT' })!.group, 'infra');
});

test('isScmRole và scmGroupOf phân loại đúng tin Chuỗi cung ứng', () => {
  assert.equal(isScmRole('Nhân Viên Kinh Doanh Xuất Nhập Khẩu'), false);
  assert.equal(isScmRole('Tài Xế Xe Tải'), false);
  assert.equal(isScmRole('Nhân Viên Thủ Kho Kiêm Lái Xe Nâng Hàng Hoá'), true);
  assert.equal(isScmRole('Chuyên Viên Thu Mua Vật Tư'), true);
  assert.equal(scmGroupOf('Chuyên Viên Thu Mua Vật Tư'), 'scm-procurement');
  assert.equal(scmGroupOf('Kế Toán Kho'), 'scm-warehouse');
  assert.equal(scmGroupOf('Nhân Viên Thủ Kho Kiêm Lái Xe Nâng Hàng Hoá'), 'scm-warehouse');
  assert.equal(scmGroupOf('Nam - Phó Kho - Làm Việc Tại Hà Nội'), 'scm-warehouse');
  assert.equal(scmGroupOf('Nhân Viên Khai Báo Hải Quan'), 'scm-import-export');
  assert.equal(scmGroupOf('Điều Phối Vận Tải Logistics'), 'scm-logistics');
  assert.equal(scmGroupOf('Supply Chain Planner'), 'scm-planning');
  assert.equal(scmGroupOf('Nhân Viên Văn Phòng'), null);
});

test('extractSkills cho ngành SCM nhận kỹ năng chuỗi cung ứng', () => {
  assert.deepEqual(
    extractSkills('Sử dụng thành thạo Excel, SAP ERP, Incoterms, khai báo hải quan và tiếng Anh giao tiếp', 'scm'),
    ['Excel', 'ERP (SAP/Odoo)', 'Tiếng Anh', 'Xuất nhập khẩu / Hải quan', 'Incoterms'],
  );
});

test('workModeOf phân biệt onsite, hybrid, remote và tránh nhận nhầm', () => {
  assert.equal(workModeOf('Fullstack Engineer - Hình thức làm việc: Remote'), 'remote');
  assert.equal(workModeOf('Kế hoạch cung ứng, làm việc từ xa (WFH)'), 'remote');
  assert.equal(workModeOf('Chuyên viên phân tích, làm việc Hybrid 2 ngày/tuần'), 'hybrid');
  assert.equal(workModeOf('Chế độ làm việc remote mỗi tháng tối đa 30% thời gian'), 'hybrid');
  assert.equal(workModeOf('12 ngày phép/năm + 12 ngày remote/năm'), 'hybrid');
  assert.equal(workModeOf('Nhân viên kho làm việc tại kho quận 9'), 'onsite');
  assert.equal(workModeOf('Lập trình viên Java làm việc onsite tại ngân hàng'), 'onsite');
  // Các trường hợp dễ nhầm
  assert.equal(workModeOf('Quản trị hạ tầng Private/Hybrid/Public Cloud'), null);
  assert.equal(workModeOf('Thời gian làm việc linh hoạt với 3 ca'), null);
  assert.equal(workModeOf('Trưởng nhóm IT làm việc tại nhà máy Bình Dương'), 'onsite');
  assert.equal(workModeOf('IT Helpdesk hỗ trợ remote qua TeamViewer cho nhân viên'), null);
});

test('toSnapshotJob gán sector scm và mode cho tin Chuỗi cung ứng', () => {
  const job = toSnapshotJob({
    source: 'vieclam24h', source_id: '3', url: 'https://vieclam24h.vn/thu-mua-kho-van-chuoi-cung-ung/x-c14p73id3.html',
    title: 'Chuyên Viên Thu Mua', company: 'Công ty Logistics', cities: ['hn'],
    date_posted: new Date('2026-11-25T00:00:00Z'), first_seen: new Date('2026-11-26T00:00:00Z'),
    skills: [], experience_months: 24, work_mode: null,
    salary_min: '15000000', salary_max: '20000000', salary_currency: 'VND', salary_unit: 'MONTH',
    category: 'thu-mua-kho-van-chuoi-cung-ung', description: '<p>Làm việc tại văn phòng, thành thạo Excel và đàm phán nhà cung cấp.</p>',
  })!;
  assert.equal(job.sector, 'scm');
  assert.equal(job.group, 'scm-procurement');
  assert.equal(job.mode, 'onsite');
  assert.deepEqual(job.skills, ['Excel', 'Thu mua / Đàm phán']);
});
