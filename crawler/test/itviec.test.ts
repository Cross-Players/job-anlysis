// Test bộ đọc ITviec trên trang mẫu tự viết (mô phỏng cấu trúc thật ngày 2026-11-21, không chép nội dung thật).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCity, parseJobPage, parseSitemap } from '../src/sources/itviec.ts';

const jobPosting = {
  '@context': 'http://schema.org',
  '@type': 'JobPosting',
  title: 'Backend Developer (Java, Spring)',
  datePosted: '2026-11-16',
  validThrough: '2026-12-21',
  skills: 'Java, Spring,  PostgreSQL, Java',
  description: '<p>Liên hệ chị Lan 0912 345 678 hoặc hr.lan@example.com</p>',
  potentialAction: { '@type': 'ApplyAction', target: 'https://itviec.com/job/x/job_applications/new' },
  hiringOrganization: { '@type': 'Organization', name: 'Công ty Mẫu', logo: 'https://itviec.com/logo.png' },
  employmentType: 'FULL_TIME',
  jobLocation: [
    { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Not Available', addressRegion: 'Hồ Chí Minh' } },
    { '@type': 'Place', address: { '@type': 'PostalAddress', addressRegion: 'Hà Nội' } },
    { '@type': 'Place', address: { '@type': 'PostalAddress', addressRegion: 'Cần Thơ' } },
  ],
  baseSalary: { '@type': 'MonetaryAmount', currency: 'USD', value: { '@type': 'QuantitativeValue', unitText: 'MONTH', value: "You'll love it" } },
  jobBenefits: '<ul><li>Lương: 25 - 35 triệu/tháng + thưởng</li><li>Bảo hiểm đầy đủ</li></ul>',
  experienceRequirements: { '@type': 'OccupationalExperienceRequirements', monthsOfExperience: 24 },
};

const page = (ld: unknown, mode = 'Linh hoạt') => `<!doctype html><html><head><title>Job</title>
<script type="application/ld+json">{"@type":"WebSite","name":"x"}</script>
<script type="application/ld+json">${JSON.stringify(ld)}</script></head><body>
<div><span class='normal-text text-rich-grey ms-1'>${mode}</span></div>
<a>Đăng nhập để xem mức lương</a>
<div class='similar'><div class='text-rich-grey flex-shrink-0'> Tại văn phòng </div></div>
</body></html>`;

test('parseSitemap lấy đúng URL tin, bỏ trùng và URL không phải tin', () => {
  const xml = `<urlset>
    <url><loc>https://itviec.com/viec-lam-it/backend-developer-cong-ty-mau-0141</loc></url>
    <url><loc>https://itviec.com/viec-lam-it/backend-developer-cong-ty-mau-0141</loc></url>
    <url><loc>https://itviec.com/viec-lam-it/qa-engineer-abc-2101</loc></url>
    <url><loc>https://itviec.com/nha-tuyen-dung/cong-ty-mau</loc></url>
  </urlset>`;
  assert.deepEqual(parseSitemap(xml), [
    { id: 'backend-developer-cong-ty-mau-0141', url: 'https://itviec.com/viec-lam-it/backend-developer-cong-ty-mau-0141' },
    { id: 'qa-engineer-abc-2101', url: 'https://itviec.com/viec-lam-it/qa-engineer-abc-2101' },
  ]);
});

test('normalizeCity nhận các cách viết, loại thành phố ngoài phạm vi', () => {
  assert.equal(normalizeCity('Hồ Chí Minh'), 'hcm');
  assert.equal(normalizeCity('Ho Chi Minh City'), 'hcm');
  assert.equal(normalizeCity('Hà Nội'), 'hn');
  assert.equal(normalizeCity('Đà Nẵng'), 'dn');
  assert.equal(normalizeCity('Cần Thơ'), null);
});

test('parseJobPage đọc đủ các trường chính', () => {
  const job = parseJobPage(page(jobPosting));
  assert.ok(job);
  assert.equal(job.title, 'Backend Developer (Java, Spring)');
  assert.equal(job.company, 'Công ty Mẫu');
  assert.deepEqual(job.regions, ['Hồ Chí Minh', 'Hà Nội', 'Cần Thơ']);
  assert.deepEqual(job.cities, ['hcm', 'hn']);
  assert.equal(job.datePosted, '2026-11-16');
  assert.equal(job.validThrough, '2026-12-21');
  assert.deepEqual(job.skills, ['Java', 'Spring', 'PostgreSQL']);
  assert.equal(job.employmentType, 'FULL_TIME');
  assert.equal(job.experienceMonths, 24);
  assert.equal(job.workMode, 'hybrid', 'lấy hình thức của tin, không lấy của thẻ việc làm tương tự');
  assert.equal(job.salaryHidden, true);
});

test('lương: không đoán từ "You\'ll love it", chỉ lấy dòng phúc lợi có số', () => {
  const job = parseJobPage(page(jobPosting))!;
  assert.equal(job.salaryText, 'Lương: 25 - 35 triệu/tháng + thưởng');

  const noSalary = parseJobPage(page({ ...jobPosting, jobBenefits: '<ul><li>Bảo hiểm</li><li>Lương tháng 13</li></ul>' }))!;
  assert.equal(noSalary.salaryText, null);

  const numeric = parseJobPage(page({ ...jobPosting, baseSalary: { currency: 'VND', value: { minValue: 20000000, maxValue: 30000000, unitText: 'MONTH' } } }))!;
  assert.equal(numeric.salaryText, '20000000 - 30000000 VND MONTH');
});

test('payload đã xóa SĐT, email, logo và link ứng tuyển', () => {
  const job = parseJobPage(page(jobPosting))!;
  const text = JSON.stringify(job.payload);
  assert.ok(!text.includes('0912'), 'không còn số điện thoại');
  assert.ok(!text.includes('hr.lan@example.com'), 'không còn email');
  assert.ok(!text.includes('logo.png'));
  assert.ok(!text.includes('job_applications'));
  assert.ok(text.includes('[sđt]') && text.includes('[email]'));
});

test('trang không có JobPosting trả null', () => {
  assert.equal(parseJobPage('<html><script type="application/ld+json">{"@type":"WebSite"}</script></html>'), null);
  assert.equal(parseJobPage('<html><script type="application/ld+json">{hỏng</script></html>'), null);
});

test('hình thức làm việc: Tại văn phòng / Làm từ xa / không có', () => {
  assert.equal(parseJobPage(page(jobPosting, 'Tại văn phòng'))!.workMode, 'onsite');
  assert.equal(parseJobPage(page(jobPosting, 'Làm từ xa'))!.workMode, 'remote');
  assert.equal(parseJobPage(page(jobPosting, 'Khác'))!.workMode, null);
});
