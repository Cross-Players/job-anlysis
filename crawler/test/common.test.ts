import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripPii } from '../src/pii.ts';
import { isAllowed, parseRobots } from '../src/robots.ts';
import { looksLikeChallenge } from '../src/http.ts';

test('stripPii xóa email và số điện thoại Việt Nam', () => {
  assert.equal(stripPii('Gửi CV: tuyen.dung@cong-ty.vn'), 'Gửi CV: [email]');
  assert.equal(stripPii('Gọi 0912 345 678 hoặc +84 912.345.678'), 'Gọi [sđt] hoặc [sđt]');
  assert.equal(stripPii('Hotline 028-3822-1234'), 'Hotline [sđt]');
});

test('stripPii không đụng vào lương, ngày, năm kinh nghiệm', () => {
  for (const s of ['Lương 15 - 20 triệu', 'Up to 2000$', 'Hạn nộp 05/12/2026', '3 năm kinh nghiệm', 'Lương 25.000.000 VND', 'Mã tin 0141']) {
    assert.equal(stripPii(s), s);
  }
});

test('robots.txt: chỉ áp nhóm *, luật dài hơn thắng', () => {
  const rules = parseRobots(`
User-agent: Yeti
Disallow: /

User-Agent: *
Disallow: /subscriptions/new
Disallow: /private/
Allow: /private/public-*
Disallow: /*?q
`);
  assert.equal(isAllowed(rules, 'https://x.vn/viec-lam-it/abc'), true, 'luật cấm của Yeti không áp cho mình');
  assert.equal(isAllowed(rules, 'https://x.vn/subscriptions/new'), false);
  assert.equal(isAllowed(rules, 'https://x.vn/private/a'), false);
  assert.equal(isAllowed(rules, 'https://x.vn/private/public-page'), true);
  assert.equal(isAllowed(rules, 'https://x.vn/search?q=java'), false);
});

test('robots.txt rỗng thì cho phép hết', () => {
  assert.equal(isAllowed(parseRobots(''), 'https://x.vn/anything'), true);
});

test('nhận ra trang thử thách Cloudflare nhưng không nhầm trang thường có script challenge-platform', () => {
  assert.equal(looksLikeChallenge('<html><head><title>Just a moment...</title>'), true);
  assert.equal(looksLikeChallenge('<html><head><title>Việc làm IT</title><script src="/cdn-cgi/challenge-platform/x.js"></script>'), false);
});
