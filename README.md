# Hiring intelligence (Next.js)

Bản demo dashboard thị trường tuyển dụng đa ngành và hồ sơ công ty, **phạm vi chỉ gồm 3 thành phố: Hà Nội, Đà Nẵng, TP.HCM**. **Toàn bộ số liệu là dữ liệu mẫu**, công ty là hư cấu.

## Chạy
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
npm test         # chạy toàn bộ test (Vitest)
```
Cần Node.js 18.17 trở lên.

## Các trang
- **Tổng quan** (`/overview`): KPI, xu hướng theo tuần, cơ cấu ngành / nhóm nghề, kỹ năng, lương, công ty tuyển mạnh.
- **Xu hướng** (`/trends`): bảng "Nghề đáng đầu tư" và biểu đồ dự báo 12 tuần tới của nghề đang chọn.
- **Công ty** (`/companies`, `/companies/[id]`): danh sách, xếp hạng và hồ sơ công ty.

Bộ lọc **ngành, thành phố, thời gian (4/12/24 tuần), cấp bậc, hình thức làm việc** dùng chung cho mọi trang.

## Cấu trúc
```
src/
  app/
    layout.tsx, globals.css        khung chung, biến màu sáng/tối, nhãn độ tin cậy, thanh điều hướng
    overview/page.tsx              trang Tổng quan
    trends/page.tsx                trang Xu hướng & dự báo
    companies/page.tsx             danh sách và xếp hạng công ty
    companies/[id]/page.tsx        hồ sơ công ty
  api/                             TẦNG DỮ LIỆU: mọi trang lấy số liệu qua đây (index.ts, types.ts, useApi.ts)
  components/
    overview/    FilterBar, KpiCards, InsightsCard, HotCompanies, TrendCard,
                 GroupMix, TopSkills, SalaryRanges, DemandVsSalary
    trends/      CareerTable, TrendDetail, SkillTrends
    companies/   RoleSwitch, CompanyFilters, CompanyTable, profile/*
    charts/      TrendLine, MixPie, ForecastChart (Recharts)
    ui/          Card, Delta, Sparkline, CitySelect, FilterSelects, Reliability
    layout/      TopNav
  context/FilterContext.tsx        bộ lọc dùng chung
  data/                            dữ liệu mẫu: series.ts (48 tuần / nhóm nghề), overview.ts, companies.ts, cities.ts
  lib/                             types, constants, series, stats, overview, forecast, ranking, roles, profile, cities
  styles/                          overview.css, company.css, trends.css (đặt trong .ov / .co / .tr)
```

## Nối dữ liệu thật (backend Python)
- Chỉ cần sửa `src/api/index.ts`: thay ruột từng hàm bằng `fetch` tới backend, **giữ nguyên kiểu trả về** trong `src/api/types.ts`. Đây là "hợp đồng" dữ liệu cho backend.
- Khi đó các file `src/data/*` và phần nhân hệ số trong `src/lib/series.ts`, `src/lib/cities.ts` không cần nữa: backend trả thẳng số đã lọc.
- Dự báo (`src/lib/forecast.ts`) là bản tạm: đường thẳng xu hướng trên 12 tuần gần nhất. Backend nên thay bằng mô hình có mùa vụ (statsmodels).
- Ngưỡng "Chưa đủ dữ liệu" là `MIN_SAMPLE = 30` tin trong `src/lib/constants.ts`. Trọng số điểm "Nghề đáng đầu tư" là `WEIGHTS` trong `src/lib/ranking.ts`.
- Ngưỡng nhãn đà tuyển (25%, −10%, 6 tin) ở `companyStatus` trong `src/lib/stats.ts` là giá trị demo.
- Lương so với nhóm tương đương hiện là số mô phỏng (`src/lib/profile.ts`).

## Test
- `src/lib/__tests__/`: các hàm tính (lọc, dự báo, xếp hạng, công ty, tổng quan).
- `src/api/__tests__/no-nan.test.ts`: thử mọi tổ hợp bộ lọc trên mọi hàm API, đảm bảo không có NaN.
- `src/components/__tests__/`: render các thẻ ra HTML với mọi tổ hợp bộ lọc, đảm bảo không hiện NaN.

## Phạm vi thành phố
- Sản phẩm chỉ theo dõi Hà Nội, Đà Nẵng, TP.HCM. Khi nối dữ liệu thật, **tin ở nơi khác sẽ bị loại** ngay từ bước nhập.
- "Cả 3 thành phố" (`city = 'all'` trong `FilterContext`) là tổng của 3 thành phố này.
- Các hệ số sau trong `src/data/cities.ts` và `src/data/companies.ts` là **số mô phỏng**, cần thay bằng số tính từ dữ liệu thật:
  - `CITY_SHARE`: tỷ trọng tin theo thành phố của từng ngành (số tin, số tin có lương, chuỗi theo tuần nhân theo hệ số này).
  - `CITY_SALARY_FACTOR`: hệ số nhân lương P25 / trung vị / P75 theo thành phố.
  - `cityShare` của từng công ty (`CITY_SPLIT`): tỷ trọng tin của công ty ở mỗi thành phố. Công ty dưới 10% ở một thành phố bị ẩn khi lọc thành phố đó.
- Logic quy đổi theo thành phố nằm ở `src/lib/series.ts` và `src/lib/cities.ts`. Với dữ liệu thật nên thay bằng truy vấn lọc theo thành phố thay vì nhân hệ số.
