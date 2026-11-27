# Hiring intelligence (Next.js)

Dashboard thị trường tuyển dụng **IT** và hồ sơ công ty, **phạm vi chỉ gồm 3 thành phố: Hà Nội, Đà Nẵng, TP.HCM**.
Số liệu là **tin thật đang mở**, crawler thu thập mỗi đêm trên VPS (thiết kế: `docs/superpowers/specs/2026-11-09-crawl-pipeline-design.md`).

## Chạy
```bash
npm install
mkdir -p public/data && scp vps:/srv/job-analysis/data/snapshot.json public/data/   # số liệu thật cho dev
npm run dev      # http://localhost:3000
npm run build    # build production
npm test         # test dashboard (Vitest)
cd crawler && npm test   # test crawler (node --test, cần Node 24)
```
Dashboard cần Node.js 18.17 trở lên. `public/data/` không vào git.

## Luồng dữ liệu
```
systemd timer 01:30 mỗi đêm (deploy/systemd)
  → crawler/src/run.ts      sitemap → tin mới / tin đóng → tải trang tin → Postgres (raw_job, scan_run)
  → crawler/src/export.ts   chuẩn hóa bằng quy tắc (normalize.ts) → /srv/job-analysis/data/snapshot.json
  → backup-db.sh            pg_dump, giữ 14 ngày
nginx phục vụ snapshot.json ở /data/snapshot.json → dashboard tải một lần, tính số theo bộ lọc ngay trên trình duyệt
```
Đổi dữ liệu **không cần build lại** trang. Đổi quy tắc phân loại chỉ cần export lại, không cần cào lại.

### Nguồn
| Nguồn | Trạng thái | Ghi chú |
|---|---|---|
| Vieclam24h | **Bật** (mặc định) | 3 danh mục IT: `it-phan-mem`, `it-phan-cung-mang`, `phan-tich-thong-ke-du-lieu`. Lương có số. Không có kỹ năng, hình thức làm việc. |
| ITviec | **Tắt** | Điều khoản 2.2 cấm thu thập khi chưa có văn bản đồng ý; từ 2026-11-22 trả 403 cho bot. Bật lại bằng `CRAWL_SOURCES=vieclam24h,itviec` khi được đồng ý. |

### Chuẩn hóa (`crawler/src/normalize.ts`, quy tắc, chưa dùng AI)
- **Lọc tin IT:** mục IT của nguồn lẫn việc kinh doanh và nghề kỹ thuật khác (lắp camera, máy in, CNC…). Loại tin kinh doanh/văn phòng, loại nghề khác khi chức danh không có từ khóa IT rõ ràng, loại tin không khớp nhóm IT nào. Số tin bị loại hiện ở cuối mỗi trang.
- **Nhóm nghề, cấp bậc:** theo từ khóa trong chức danh (tiếng Việt so có dấu, viết tắt so phân biệt hoa thường), cấp bậc thêm số tháng kinh nghiệm.
- **Kỹ năng:** trường `skills` của nguồn, không có thì tìm từ khóa trong chức danh + mô tả.
- **Lương:** chỉ khi nguồn ghi số; quy về triệu VND/tháng (USD theo `USD_VND`). Không có thì để trống.
- Chưa gộp tin trùng giữa các nguồn / tin đăng lại (spec mục 6).

### Đang ẩn vì chưa đủ dữ liệu
- **Xu hướng & dự báo** (`/trends`, tab đã ẩn): cần ≥ 8 tuần thu thập (`MIN_TREND_WEEKS`). Trang chỉ báo ngày dự kiến có. `src/lib/forecast.ts` và `components/charts/ForecastChart.tsx` giữ lại để dùng khi đủ.
- **So sánh kỳ trước, đà tuyển** của công ty: cần lịch sử.
- **Hình thức làm việc** (bộ lọc tự hiện khi có ≥ 30 tin ghi rõ hình thức).
- **Loại hình, lĩnh vực, quy mô công ty:** chưa có bước phân loại công ty.
- Ngưỡng: `MIN_SAMPLE = 30` (KPI, tỷ trọng), `MIN_SALARY_SAMPLE = 10` (lương theo nhóm, dưới 30 ghi "mẫu nhỏ") trong `src/lib/constants.ts`.

## Các trang
- **Tổng quan** (`/overview`): KPI, cơ cấu nhóm nghề, kỹ năng, cấp bậc, lương theo nhóm, công ty tuyển nhiều.
- **Công ty** (`/companies`, `/companies/profile?id=…`): danh sách và hồ sơ công ty, link về tin gốc.

Bộ lọc **thành phố, cấp bậc** (và hình thức khi đủ dữ liệu) dùng chung cho mọi trang.

## Cấu trúc
```
src/
  api/          index.ts (tải snapshot), snapshot.ts (kiểu file, phải khớp crawler/src/export.ts), useApi.ts
  lib/          market.ts (tính số liệu từ snapshot), constants, types, forecast (để dành)
  app/          overview, companies, companies/profile, trends
  components/   overview/*, companies/*, charts/MixPie + ForecastChart, ui/*, layout/TopNav
  test/         fixture.ts (snapshot giả cho test)
crawler/
  src/          run.ts (cào), export.ts (xuất snapshot), normalize.ts (quy tắc), report.ts (báo cáo nhanh),
                sources/ (vieclam24h, itviec, jsonld dùng chung), schema.sql
deploy/         docker-compose.yml, nginx.conf, deploy.sh, backup-db.sh, systemd/
```

## Test
- `src/lib/__tests__/market.test.ts`: các hàm tính (lương, cơ cấu, lọc thành phố, công ty).
- `src/components/__tests__/render.test.tsx`: render các thẻ với mọi tổ hợp bộ lọc, snapshot đủ / ít / rỗng, đảm bảo không hiện NaN.
- `crawler/test/`: đọc trang nguồn (trang mẫu tự viết), xóa thông tin cá nhân, quy tắc phân loại.

## Deploy (VPS)
- `./deploy/deploy.sh`: rsync mã nguồn lên `vps:/srv/job-analysis` (không đụng `deploy/.env`, `data/`), build và chạy dashboard + Postgres, build image crawler, cài systemd timer.
- `deploy/.env` (chỉ trên VPS): `DB_PASSWORD`.
- Chạy tay: `cd /srv/job-analysis/deploy && systemctl start job-analysis-crawl.service` (cào + export + sao lưu), hoặc chỉ export: `docker compose --profile crawler run --rm crawler node src/export.ts`. Xem log: `journalctl -u job-analysis-crawl.service`.
- Caddy (`/srv/ragre/app/deploy/vps/caddy/Caddyfile.letsencrypt`) định tuyến `jobs-analysis.crosstechedu.com` và `jobs.14-225-81-171.sslip.io` → `job-analysis:80`.

## Giấy phép (License)
Dự án được phân phối theo giấy phép mã nguồn mở **Apache License 2.0**. Xem chi tiết tại tệp [LICENSE](LICENSE).
