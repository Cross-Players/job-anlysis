// Test bộ đọc Vieclam24h trên trang mẫu tự viết (mô phỏng cấu trúc thật ngày 2026-11-22, không chép nội dung thật).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryOf, parseJobPage, parseJobSitemap } from '../src/sources/vieclam24h.ts';

const URL_SW = 'https://vieclam24h.vn/it-phan-mem/lap-trinh-vien-backend-c8p210000187id200000001.html';

const jobPosting = {
  '@context': 'https://schema.org/',
  '@type': 'JobPosting',
  title: 'Lập Trình Viên Backend (PHP, Node.Js)',
  description: '<p>Phát triển API bằng Node.js. Liên hệ anh Nam 0987 654 321, nam@example.com</p>',
  industry: 'IT Phần mềm',
  identifier: { '@type': 'PropertyValue', name: 'Công ty Mẫu', value: '123' },
  experienceRequirements: { '@type': 'OccupationalExperienceRequirements', monthsOfExperience: 24 },
  datePosted: '2026-11-19',
  validThrough: '2025-04-09T23:59:59+07:00',
  employmentType: 'FULL_TIME',
  hiringOrganization: { '@type': 'Organization', name: 'Công ty Mẫu', sameAs: 'https://vieclam24h.vn/x', logo: 'https://cdn/x.png' },
  jobLocation: [{ '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'TP.HCM', addressRegion: 'TP.HCM' } }],
  baseSalary: { '@type': 'MonetaryAmount', currency: 'VND', value: { '@type': 'QuantitativeValue', unitText: 'MONTH', minValue: 25000000, maxValue: 35000000 } },
};

const page = (ld: unknown, provinceIds = '[210000187]') => `<!doctype html><html><head>
<script type="application/ld+json">${JSON.stringify(ld)}</script></head><body>
<script id="__NEXT_DATA__" type="application/json">{"props":{"initialState":{"api":{"jobDetailHiddenContact":{"data":{"province_ids":${provinceIds},"contact_name":"Nam","contact_phone":"0987654321"}}}}}}</script>
</body></html>`;

test('parseJobSitemap lấy tin IT và SCM, bỏ trùng theo mã tin', () => {
  const xml = `<urlset>
    <url><loc>${URL_SW}</loc></url>
    <url><loc>${URL_SW}</loc></url>
    <url><loc>https://vieclam24h.vn/it-phan-cung-mang/ky-thuat-vien-c7p73id200000002.html</loc></url>
    <url><loc>https://vieclam24h.vn/phan-tich-thong-ke-du-lieu/data-analyst-c26p104id200000003.html</loc></url>
    <url><loc>https://vieclam24h.vn/thu-mua-kho-van-chuoi-cung-ung/chuyen-vien-thu-mua-c14p73id200000005.html</loc></url>
    <url><loc>https://vieclam24h.vn/xuat-nhap-khau/nhan-vien-xuat-nhap-khau-c15p122id200000006.html</loc></url>
    <url><loc>https://vieclam24h.vn/ke-toan/ke-toan-tong-hop-c17p73id200000004.html</loc></url>
    <url><loc>https://vieclam24h.vn/viec-lam-ha-noi-p73.html</loc></url>
  </urlset>`;
  assert.deepEqual(parseJobSitemap(xml).map((j) => j.id), ['200000001', '200000002', '200000003', '200000005', '200000006']);
});

test('categoryOf đọc danh mục từ URL tin', () => {
  assert.equal(categoryOf(URL_SW), 'it-phan-mem');
  assert.equal(categoryOf('https://vieclam24h.vn/viec-lam-ha-noi-p73.html'), null);
});

test('parseJobPage đọc trường chính, lương dạng số, bỏ validThrough không đáng tin', () => {
  const job = parseJobPage(page(jobPosting), URL_SW)!;
  assert.equal(job.title, 'Lập Trình Viên Backend (PHP, Node.Js)');
  assert.equal(job.company, 'Công ty Mẫu');
  assert.deepEqual(job.regions, ['TP.HCM']);
  assert.deepEqual(job.cities, ['hcm']);
  assert.equal(job.datePosted, '2026-11-19');
  assert.equal(job.validThrough, null);
  assert.equal(job.experienceMonths, 24);
  assert.equal(job.salaryMin, 25000000);
  assert.equal(job.salaryMax, 35000000);
  assert.equal(job.salaryCurrency, 'VND');
  assert.equal(job.salaryUnit, 'MONTH');
  assert.equal(job.salaryHidden, false);
  assert.equal(job.category, 'it-phan-mem');
  assert.equal(job.workMode, null);
});

test('parseJobPage không lưu thông tin liên hệ và xóa SĐT/email trong mô tả', () => {
  const job = parseJobPage(page(jobPosting), URL_SW)!;
  const saved = JSON.stringify(job.payload);
  assert.ok(!saved.includes('0987'), 'không còn số điện thoại');
  assert.ok(!saved.includes('nam@example.com'), 'không còn email');
  assert.ok(!saved.includes('contact_'), 'không lấy khối liên hệ trong __NEXT_DATA__');
  assert.ok(!saved.includes('logo'), 'bỏ logo');
});

test('parseJobPage: lương "Thỏa thuận" (không có số) thì để trống, không đoán', () => {
  const { baseSalary: _s, ...noSalary } = jobPosting;
  const job = parseJobPage(page(noSalary), URL_SW)!;
  assert.equal(job.salaryMin, null);
  assert.equal(job.salaryMax, null);
  assert.equal(job.salaryText, null);
});

test('parseJobPage: thành phố lấy cả từ province_ids khi jobLocation ở nơi khác', () => {
  const ld = { ...jobPosting, jobLocation: [{ '@type': 'Place', address: { addressRegion: 'Bình Dương' } }] };
  assert.deepEqual(parseJobPage(page(ld, '[210000160, 999]'), URL_SW)!.cities, ['hn']);
  assert.deepEqual(parseJobPage(page(ld, '[999]'), URL_SW)!.cities, []);
});

test('parseJobPage trả null khi không có JobPosting', () => {
  assert.equal(parseJobPage('<html><body>404</body></html>', URL_SW), null);
});
