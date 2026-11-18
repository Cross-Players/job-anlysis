# Frontend: bộ lọc chung, Xu hướng & Dự báo, Nghề đáng đầu tư — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mở khóa bộ lọc thời gian / cấp bậc / hình thức trên mọi trang, thêm trang `/trends` (bảng Nghề đáng đầu tư + biểu đồ dự báo 12 tuần), tất cả trên một bộ dữ liệu mẫu 48 tuần, lấy qua tầng `src/api/` giống API thật.

**Architecture:** Dữ liệu mẫu 48 tuần cho từng nhóm nghề và công ty nằm trong `src/data/`. Các hàm tính thuần (không React) nằm trong `src/lib/`: lọc, dự báo, xếp hạng. `src/api/` bọc các hàm đó thành Promise, để sau này đổi sang `fetch` tới backend Python. Trang dùng hook `useApi`. Bộ lọc dùng chung nằm trong `FilterContext`.

**Tech Stack:** Next.js 14, React 18, TypeScript, Recharts 2.13, Vitest (mới, chỉ dùng cho test).

**Spec:** `docs/superpowers/specs/2026-11-10-frontend-trends-design.md`

## Global Constraints

- Mọi code theo skill `writing-student-readable-code` (`.claude/skills/writing-student-readable-code/SKILL.md`): hàm ≤ ~30 dòng, mỗi file mở đầu bằng 2–4 dòng comment tiếng Việt, comment giải thích TẠI SAO, ưu tiên vòng `for` thường, không mẹo khó.
- Biểu đồ theo skill `dataviz`: màu theo thực thể (`--s1..--s6`), có tooltip, không dùng hai trục y, chữ không mang màu của series.
- Không thêm thư viện runtime mới. Chỉ thêm `vitest` (devDependency).
- Chỉ 3 thành phố `hn | dn | hcm`.
- Ngưỡng cỡ mẫu: `MIN_SAMPLE = 30` tin. Dưới ngưỡng thì hiện "Chưa đủ dữ liệu".
- Dự báo: 12 tuần, fit trên 12 tuần gần nhất, vùng mờ = ±1,5 × độ lệch chuẩn phần dư × √k (k = số tuần ra xa), ẩn nếu lịch sử < 8 tuần. Hướng đi: ±5%.
- Trọng số điểm: người mới 0.30, nhu cầu 0.25, dự báo 0.20, lương 0.15, độ rộng 0.10. Độ khó tuyển chỉ hiển thị.
- Tuần "ước lượng" = 12 tuần cũ nhất trong 24 tuần gần đây (chỉ số 24–35 của mảng 48, cũ → mới).
- Dữ liệu mẫu cố định, không dùng `Math.random()`.
- Chữ hiển thị: "Dự báo", "Ước lượng", "Chưa đủ dữ liệu", "Đang lên", "Đi ngang", "Đang xuống", mức chắc chắn "Cao", "Trung bình", "Thấp".
- Thư mục chưa dùng git: thay các bước commit bằng **Checkpoint** (chạy `npm test` + `npx tsc --noEmit`). Nếu người dùng đồng ý `git init` thì commit ở mỗi checkpoint.

## Review Focus

1. **Bộ lọc thu hẹp đến mức gần 0 tin** (ví dụ Đà Nẵng + Intern + Remote): mọi trang hiện "Chưa đủ dữ liệu" hoặc danh sách rỗng có lời nhắn, không có NaN, Infinity hay chia cho 0. Test nằm ở Task 7 (`no-nan.test.ts`).
2. **Chuỗi phẳng hoặc toàn số 0** khi dự báo: độ dốc 0, vùng mờ hữu hạn, nhãn "Đi ngang", không NaN. Test nằm ở Task 3.
3. **Tất cả giá trị bằng nhau khi quy về 0–100** (ví dụ chỉ còn một nghề đủ dữ liệu): trả 50, không NaN. Test nằm ở Task 4.
4. **Đổi bộ lọc khi đang chọn một nhóm** (`sel`) mà nhóm đó không còn trong danh sách, ví dụ đổi ngành: `sel` tự bỏ chọn, trang không trắng. Test nằm ở Task 6 (`computeOverview` với `sel` không tồn tại trả `S = null`).
5. **Hồ sơ công ty với bộ lọc không có vị trí nào khớp**: bảng vị trí hiện lời nhắn, KPI không NaN. Test nằm ở Task 5.

---

## Cấu trúc file

| File | Trách nhiệm |
|---|---|
| `src/lib/types.ts` (sửa) | thêm `Level`, `WorkMode`, `Filters`, `GroupSeries`; sửa `Company` |
| `src/lib/constants.ts` (mới) | `MIN_SAMPLE`, `LEVELS`, `WORK_MODES`, nhãn tiếng Việt, `LEVEL_SALARY_FACTOR`, `ESTIMATED_WEEKS` |
| `src/data/series.ts` (mới) | sinh `GROUP_SERIES` 48 tuần từ bảng thông số |
| `src/data/overview.ts` (sửa) | `IND` chỉ còn `name`, `ratio`, `sk` (bỏ `cur`, `prev`, `fam`, `g`, `disc`) |
| `src/data/companies.ts` (sửa) | công ty có 48 tuần, `levelShare`, `modeShare` |
| `src/lib/series.ts` (mới) | cộng theo khung tuần, hệ số lọc, `groupStats`, `groupWeekly` |
| `src/lib/forecast.ts` (mới) | hồi quy, dự báo, backtest, hướng đi |
| `src/lib/ranking.ts` (mới) | chuẩn hóa, điểm, câu giải thích |
| `src/lib/stats.ts`, `overview.ts`, `cities.ts`, `profile.ts` (sửa) | chạy trên dữ liệu mới và nhận `Filters` |
| `src/api/types.ts`, `src/api/index.ts`, `src/api/useApi.ts` (mới) | tầng dữ liệu giống API |
| `src/context/FilterContext.tsx` (sửa) | thêm `weeks`, `level`, `mode` |
| `src/components/ui/FilterSelects.tsx` (mới) | 3 ô chọn thời gian / cấp bậc / hình thức |
| `src/components/ui/Reliability.tsx` (mới) | `SampleSize`, `NotEnough`, `StatusBadge` (Ước lượng / Dự báo) |
| `src/components/charts/ForecastChart.tsx` (mới) | biểu đồ lịch sử + dự báo + vùng mờ |
| `src/components/trends/*` (mới) | `CareerTable`, `TrendDetail`, `SkillTrends` |
| `src/app/trends/page.tsx` (mới), `src/styles/trends.css` (mới) | trang Xu hướng |
| `vitest.config.ts` (mới), `package.json` (sửa) | chạy test |

**Mốc kiểm tra các trang cũ** (dùng ở Task 11):
- **Tổng quan:** 4 KPI (Tin mới, Công ty đang tuyển, Lương trung vị, Tỷ lệ công khai lương), Điểm nhấn tự động, Tin mới theo tuần, Cơ cấu (biểu đồ tròn + danh sách), Kỹ năng được nhắc nhiều, Lương theo nhóm nghề, Nhiều việc / lương cao, Công ty tuyển mạnh.
- **Công ty:** chuyển vai trò, gợi ý, bộ lọc, bảng 7 cột (Công ty, Loại hình · Lĩnh vực, Tin mới, Đà tuyển, Lương vs nhóm TĐ, Công khai lương, Stack chính).
- **Hồ sơ công ty:** tiêu đề + nhãn, KPI (4 ô), Đà tuyển dụng, Stack, Lương so với vị trí tương đương, Vị trí đang mở.

---

### Task 1: Cài Vitest, kiểu dữ liệu bộ lọc và hằng số

**Files:**
- Modify: `package.json` (thêm `"test": "vitest run"`, devDependency `vitest@2.1.8`)
- Create: `vitest.config.ts` (alias `@` → `./src`, môi trường `node`)
- Modify: `src/lib/types.ts`
- Create: `src/lib/constants.ts`
- Test: `src/lib/__tests__/constants.test.ts`

**Interfaces:**
- Produces (trong `types.ts`):
  ```ts
  export type Level = 'intern' | 'fresher' | 'junior' | 'middle' | 'senior' | 'lead';
  export type WorkMode = 'onsite' | 'hybrid' | 'remote';
  export type Weeks = 4 | 12 | 24;
  export interface Filters { weeks: Weeks; city: CityFilter; level: Level | 'all'; mode: WorkMode | 'all' }
  export interface GroupSeries {
    id: string;            // duy nhất toàn hệ thống, ví dụ 'it-web'
    industry: string;      // 'it' | 'kt' | 'mk'
    name: string;          // 'Web'
    isOther: boolean;      // nhóm "Khác" không được xếp hạng
    weeklyJobs: number[];  // 48 phần tử, cũ → mới
    weeklySalary: number[];// 48 phần tử, trung vị triệu VND
    p25Ratio: number; p75Ratio: number; // P25 = trung vị × p25Ratio
    disclosed: number;     // tỷ lệ tin có lương 0–1
    companies: number;     // số công ty khác nhau đang tuyển (12 tuần, cả 3 thành phố)
    daysOpen: number;      // số ngày trung bình một tin còn mở
    levelShare: Record<Level, number>; // tổng = 1
    modeShare: Record<WorkMode, number>; // tổng = 1
  }
  ```
- Produces (trong `constants.ts`): `MIN_SAMPLE = 30`, `TOTAL_WEEKS = 48`, `ESTIMATED_WEEKS = { from: 24, to: 35 }` (chỉ số trong mảng 48), `LEVELS: { key: Level; label: string }[]` (Intern, Fresher, Junior, Middle, Senior, Lead+), `WORK_MODES: { key: WorkMode; label: string }[]` (Onsite, Hybrid, Remote), `NEWCOMER_LEVELS: Level[] = ['intern','fresher','junior']`, `LEVEL_SALARY_FACTOR: Record<Level, number>` = `{ intern: 0.35, fresher: 0.55, junior: 0.75, middle: 1, senior: 1.35, lead: 1.7 }`, `DEFAULT_FILTERS: Filters = { weeks: 12, city: 'all', level: 'all', mode: 'all' }`.

- [ ] **Step 1: Cài vitest:** `npm install -D vitest@2.1.8`. Thêm script `test`. Tạo `vitest.config.ts`.
- [ ] **Step 2: Viết test lỗi** `constants.test.ts`: `LEVELS.length === 6`, `WORK_MODES.length === 3`, `DEFAULT_FILTERS.weeks === 12`, `ESTIMATED_WEEKS.to - ESTIMATED_WEEKS.from + 1 === 12`.
- [ ] **Step 3:** Chạy `npm test`. Kết quả mong đợi: FAIL (chưa có module `constants`).
- [ ] **Step 4:** Viết `types.ts` (phần thêm) và `constants.ts`.
- [ ] **Step 5:** Chạy `npm test`. Kết quả mong đợi: PASS. Chạy `npx tsc --noEmit`. Kết quả mong đợi: sạch (task này chỉ thêm kiểu, chưa sửa `Company`).
- [ ] **Step 6: Checkpoint.**

### Task 2: Dữ liệu mẫu 48 tuần và hàm lọc nhóm nghề

**Files:**
- Create: `src/data/series.ts`
- Create: `src/lib/series.ts`
- Test: `src/lib/__tests__/series.test.ts`

**Interfaces:**
- Consumes: `GroupSeries`, `Filters`, hằng số ở Task 1. Đọc `CITY_SHARE`, `CITY_SALARY_FACTOR` (`src/data/cities.ts`).
- Produces:
  - `GROUP_SERIES: GroupSeries[]`: 18 nhóm, gồm 6 nhóm của mỗi ngành, đúng tên đang có trong `fam` của `src/data/overview.ts`. Id có dạng `${industry}-${slug}`, ví dụ `it-web`, `it-khac`, `kt-ke-toan-tong-hop`.
  - `windowSum(values: number[], weeks: number, offset?: number): number`: tổng `weeks` phần tử, kết thúc tại vị trí `values.length - offset`.
  - `filterFactor(g: GroupSeries, f: Filters): number` = tỷ trọng thành phố × `levelShare[level]` (hoặc 1 nếu `'all'`) × `modeShare[mode]` (hoặc 1).
  - `salaryFactor(f: Filters): number` = hệ số lương thành phố × `LEVEL_SALARY_FACTOR[level]` (hoặc 1).
  - `groupWeekly(g: GroupSeries, f: Filters): number[]`: 48 số đã nhân `filterFactor` và làm tròn.
  - `groupStats(g: GroupSeries, f: Filters): Group`: dùng kiểu `Group` có sẵn. `jobs` = tổng `f.weeks` tuần cuối, `prev` = tổng `f.weeks` tuần trước đó, `med` = trung bình lương `f.weeks` tuần cuối × `salaryFactor`, `p25`/`p75` = `med` × tỷ lệ, `n` = round(`jobs` × `disclosed`).
  - `seriesOfIndustry(ind: string): GroupSeries[]`.

**Cách sinh dữ liệu** (bảng thông số trong `series.ts`, mỗi nhóm một dòng):
`[industry, name, baseJobsPerWeek, weeklyGrowthPct, baseSalary, salaryGrowthPctPer12w, p25Ratio, p75Ratio, disclosed, companies, daysOpen, newcomerShare, onsiteShare, remoteShare]`.
Tuần i (0..47): `jobs = round(base × (1 + growth × (i − 36) / 100) × (1 + 0.06 × sin(i × 0.9 + k)))`, với k là thứ tự nhóm. Kẹp `jobs` tối thiểu là 0.
Phân bổ `newcomerShare` cho intern / fresher / junior theo tỷ lệ 0.15 / 0.35 / 0.5. Phần còn lại chia cho middle / senior / lead theo 0.5 / 0.35 / 0.15.
Bắt buộc có: ít nhất 1 nhóm tăng ≥ +2%/tuần (`it-data`), 1 nhóm đi ngang (`kt-ke-toan-tong-hop`), 1 nhóm giảm (`it-mobile`, khoảng −1,5%/tuần), và 1 nhóm có rất ít tin (`kt-ke-toan-truong`, khoảng 3 tin/tuần, để dưới `MIN_SAMPLE` khi lọc theo thành phố).

- [ ] **Step 1: Viết test lỗi** `series.test.ts`:
  - `GROUP_SERIES.length === 18`. Id không trùng. Mọi `weeklyJobs.length === 48`.
  - `levelShare` và `modeShare` mỗi nhóm có tổng ≈ 1 (sai số 1e-6).
  - `windowSum([1,2,3,4,5], 2) === 9`, `windowSum([1,2,3,4,5], 2, 2) === 5`.
  - `groupStats(itData, DEFAULT_FILTERS).jobs > groupStats(itData, DEFAULT_FILTERS).prev` (vì đang tăng).
  - Hệ số lọc: `groupStats(g, {...DEFAULT_FILTERS, level: 'intern', mode: 'remote', city: 'dn'})` có `jobs` ≥ 0 và `med` hữu hạn.
  - Đúng 3 nhóm có `isOther === true`.
- [ ] **Step 2:** Chạy `npm test`. Kết quả mong đợi: FAIL.
- [ ] **Step 3:** Viết `src/data/series.ts` và `src/lib/series.ts`.
- [ ] **Step 4:** Chạy `npm test`. Kết quả mong đợi: PASS.
- [ ] **Step 5: Checkpoint.**

### Task 3: Dự báo

**Files:**
- Create: `src/lib/forecast.ts`
- Test: `src/lib/__tests__/forecast.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface ForecastPoint { week: number; mid: number; lo: number; hi: number } // week = 1..12 tuần tới
  export type Direction = 'up' | 'flat' | 'down';
  export type Confidence = 'high' | 'medium' | 'low';
  export interface ForecastResult { points: ForecastPoint[]; changePct: number; direction: Direction; confidence: Confidence; backtestErrorPct: number | null }
  export const FORECAST_WEEKS = 12; export const FIT_WEEKS = 12; export const MIN_HISTORY = 8;
  export const DIRECTION_THRESHOLD_PCT = 5; export const BAND_MULTIPLIER = 1.5;
  export const CONFIDENCE_HIGH = 0.15; export const CONFIDENCE_MEDIUM = 0.3; // tỷ lệ nửa độ rộng vùng mờ / mid
  export function linearFit(values: number[]): { slope: number; intercept: number }
  export function residualStd(values: number[], slope: number, intercept: number): number
  export function forecastSeries(history: number[]): ForecastResult | null
  export function backtestErrorPct(history: number[], holdout?: number): number | null // mặc định holdout = 4
  ```
- Quy tắc:
  - `forecastSeries` trả `null` nếu `history.length < MIN_HISTORY`. Fit trên `FIT_WEEKS` phần tử cuối.
  - `mid` = giá trị đường thẳng ở tuần tới, kẹp ≥ 0. `lo` = max(0, mid − 1.5·std·√k), `hi` = mid + 1.5·std·√k.
  - `changePct` = (tổng `mid` 12 tuần tới − tổng 12 tuần cuối) / tổng 12 tuần cuối × 100. Nếu tổng 12 tuần cuối bằng 0 thì `changePct` = 0.
  - `direction`: `changePct` ≥ 5 là `up`, ≤ −5 là `down`, còn lại `flat`.
  - `confidence`: lấy trung bình của (hi − mid) / mid trên 12 điểm. Nhỏ hơn 0.15 là `high`, nhỏ hơn 0.3 là `medium`, còn lại `low`. Nếu mid = 0 thì tính là `low`.
  - `backtestErrorPct`: bỏ `holdout` tuần cuối, dự báo bằng cùng cách, rồi lấy trung bình |dự − thật| / thật × 100 trên các tuần mà thật > 0. Trả `null` nếu phần còn lại < `MIN_HISTORY` hoặc không có tuần nào thật > 0.

- [ ] **Step 1: Viết test lỗi** `forecast.test.ts`:
  - `linearFit([1,2,3,4])` có slope ≈ 1, intercept ≈ 1 (x bắt đầu từ 0).
  - `forecastSeries([1,2,3,4,5,6,7])` là `null`.
  - Chuỗi tăng `[10,12,...]` (12 phần tử, mỗi tuần +2): `direction === 'up'`, `points.length === 12`, `points[0].mid` ≈ 34, và `residualStd` ≈ 0 nên `confidence === 'high'`.
  - Chuỗi phẳng 12 số 20: `direction === 'flat'`, `changePct === 0`.
  - Chuỗi toàn 0: không NaN ở mọi trường, `direction === 'flat'`, `confidence === 'low'`.
  - Chuỗi giảm: `direction === 'down'`, mọi `lo >= 0`.
  - Vùng mờ rộng dần: `points[11].hi - points[11].mid > points[0].hi - points[0].mid` với chuỗi có nhiễu.
  - `backtestErrorPct` của chuỗi thẳng ≈ 0. Của chuỗi 10 phần tử thì là `null` (10 − 4 < 8).
- [ ] **Step 2:** Chạy `npm test`. Kết quả mong đợi: FAIL.
- [ ] **Step 3:** Viết `forecast.ts`. Comment đầu file nói rõ đây là bản tạm, backend Python (statsmodels) sẽ thay.
- [ ] **Step 4:** Chạy `npm test`. Kết quả mong đợi: PASS.
- [ ] **Step 5: Checkpoint.**

### Task 4: Xếp hạng Nghề đáng đầu tư

**Files:**
- Create: `src/lib/ranking.ts`
- Test: `src/lib/__tests__/ranking.test.ts`

**Interfaces:**
- Consumes: `GROUP_SERIES`, `groupStats`, `groupWeekly` (Task 2). `forecastSeries` (Task 3). `cityLabel` (`src/lib/cities.ts`).
- Produces:
  ```ts
  export const WEIGHTS = { newcomer: 0.3, demand: 0.25, forecast: 0.2, salary: 0.15, breadth: 0.1 };
  export interface CareerRow {
    id: string; name: string; industry: string; industryName: string;
    enoughData: boolean;              // jobs >= MIN_SAMPLE
    score: number | null;             // 0–100, null nếu !enoughData
    demandPct: number;                // jobs so với prev, %
    salaryPct: number;                // trung vị kỳ này so với kỳ trước, %
    companies: number;                // đã nhân hệ số thành phố, làm tròn
    daysOpen: number;
    newcomerPct: number;              // % tin Intern/Fresher/Junior, KHÔNG theo bộ lọc cấp bậc
    forecastPct: number | null;       // changePct của dự báo số tin
    direction: Direction | null;
    sentence: string;
  }
  export function normalize(values: number[]): number[] // min–max về 0–100; tất cả bằng nhau thì trả 50
  export function rankCareers(ind: string, f: Filters): CareerRow[] // ind = 'all' | key ngành
  export function explainRow(row: CareerRow, f: Filters): string
  ```
- Quy tắc:
  - Bỏ nhóm có `isOther`. Chỉ chuẩn hóa và chấm điểm trên các dòng `enoughData`.
  - Dòng thiếu dữ liệu xếp cuối, có `score = null`.
  - Sắp giảm dần theo `score`.
  - Mẫu câu giải thích: `"{name} · {cityLabel(f.city)}: nhu cầu {±x}%, {y}% tin nhận người mới, dự báo {đang lên|đi ngang|đang xuống}."`. Nếu thiếu dữ liệu thì câu là `"{name} · {city}: chưa đủ dữ liệu để đánh giá."`.

- [ ] **Step 1: Viết test lỗi** `ranking.test.ts`:
  - `normalize([1,2,3])` cho `[0,50,100]`. `normalize([5,5])` cho `[50,50]`. `normalize([])` cho `[]`.
  - `rankCareers('all', DEFAULT_FILTERS)` có 15 dòng (18 − 3 nhóm Khác), không có id kết thúc bằng `-khac`.
  - Điểm giảm dần trong các dòng có dữ liệu. Mọi dòng `enoughData === false` đứng sau.
  - `it-data` có `direction === 'up'`, `it-mobile` có `direction === 'down'`.
  - `newcomerPct` của một nhóm giống nhau giữa `level: 'all'` và `level: 'senior'`.
  - Với `{city:'dn', level:'intern', mode:'remote'}`: không NaN ở mọi trường số, các dòng thiếu dữ liệu có `score === null`.
  - `explainRow` chứa tên thành phố khi `city: 'hcm'` (chuỗi "TP.HCM").
- [ ] **Step 2:** Chạy `npm test`. Kết quả mong đợi: FAIL.
- [ ] **Step 3:** Viết `ranking.ts`.
- [ ] **Step 4:** Chạy `npm test`. Kết quả mong đợi: PASS.
- [ ] **Step 5: Checkpoint.**

### Task 5: Dữ liệu công ty theo bộ lọc

**Files:**
- Modify: `src/lib/types.ts` (`Company`)
- Modify: `src/data/companies.ts`
- Modify: `src/lib/cities.ts` (`companyInCity` → `companyInFilters`, `companiesInCity` → `companiesInFilters`)
- Modify: `src/lib/profile.ts` (`buildJobs`, `buildPeerRows` nhận `Filters`)
- Modify: `src/lib/stats.ts` (`companyStatus` giữ nguyên ngưỡng)
- Test: `src/lib/__tests__/companies.test.ts`

**Interfaces:**
- `Company` thêm các trường: `weekly: number[]` (48 tuần, cũ → mới), `levelShare: Record<Level, number>`, `modeShare: Record<WorkMode, number>`. `w` lúc này là `f.weeks` tuần cuối sau khi lọc. `j` = tổng `f.weeks` tuần cuối, `p` = `f.weeks` tuần trước đó. `onsite` = round(`modeShare.onsite` × 100).
- Produces:
  - `companyInFilters(c: Company, f: Filters): Company`
  - `companiesInFilters(list: Company[], f: Filters): Company[]`: vẫn ẩn công ty có tỷ trọng thành phố < `MIN_COMPANY_CITY_SHARE`, và ẩn thêm công ty có `j === 0` sau khi lọc.
  - `buildJobs(c: Company, f: Filters): OpenJob[]`: lọc thêm theo cấp bậc và hình thức. Tên cấp trong `SAMPLE` đổi sang key `Level`, hiển thị bằng nhãn trong `LEVELS`.
  - `buildPeerRows(c: Company, f: Filters): PeerRow[]`: lương nhân `salaryFactor(f)`.
- Sinh `weekly` 48 tuần: dùng công thức sẵn có trong `COMPANIES` nhưng chạy i = 0..47 (`r[4] + r[5] × (i − 36) / 3 + sin(...)`, kẹp ≥ 0). Đặt `levelShare` và `modeShare` mỗi công ty sao cho `modeShare.onsite` khớp với `% onsite` hiện có.
- Cột "Tin mới 4 tuần" trong `CompanyTable` và `ProfileKpis` đổi nhãn thành `Tin mới {f.weeks} tuần`. Đà tuyển = `f.weeks` tuần so với `f.weeks` tuần trước. Phần sửa giao diện làm ở Task 8.

- [ ] **Step 1: Viết test lỗi** `companies.test.ts`:
  - Mọi công ty có `weekly.length === 48`. `levelShare` và `modeShare` có tổng ≈ 1.
  - `companyInFilters(c, DEFAULT_FILTERS).w.length === 12`. Với `weeks: 4` thì `w.length === 4`.
  - `j` với `mode: 'remote'` ≤ `j` với `mode: 'all'`.
  - `buildJobs(c, {...DEFAULT_FILTERS, level: 'senior'})` chỉ có job cấp `senior`.
  - Bộ lọc không có job nào khớp: `buildJobs` trả `[]`. `companyInFilters` không có NaN ở `j`, `p`, `g`, `open`.
- [ ] **Step 2:** Chạy `npm test`. Kết quả mong đợi: FAIL.
- [ ] **Step 3:** Sửa các file ở trên. Các component đang gọi `companyInCity` / `companiesInCity` / `buildJobs(c, city)` tạm truyền `{...DEFAULT_FILTERS, city}` để tsc sạch. Task 8 sẽ nối bộ lọc thật.
- [ ] **Step 4:** Chạy `npm test` và `npx tsc --noEmit`. Kết quả mong đợi: PASS và sạch.
- [ ] **Step 5: Checkpoint.**

### Task 6: Tính toán trang Tổng quan trên dữ liệu mới

**Files:**
- Modify: `src/data/overview.ts` (bỏ `cur`, `prev`, `fam`, `g`, `disc` khỏi `IND`. Giữ `name`, `ratio`, `sk`, `ALL_SKILLS`)
- Modify: `src/lib/types.ts` (`Industry` khớp lại, bỏ `FamTuple`)
- Modify: `src/lib/stats.ts` (`getGroups(ind, f)`, `getSeries(ind, f)`, `weekLabels(weeks)`)
- Modify: `src/lib/overview.ts`
- Test: `src/lib/__tests__/overview.test.ts`

**Interfaces:**
- Produces:
  - `getGroups(ind: string, f: Filters): Group[]`. Với `'all'` thì mỗi ngành là một `Group` (`id` = key ngành), cộng từ các nhóm của ngành đó. Lương tính trung bình có trọng số theo `n`. Với một ngành thì mỗi nhóm nghề là một `Group` (`id` = id `GroupSeries`).
  - `getSeries(ind: string, f: Filters): { cur: number[]; prev: number[] }`, độ dài = `f.weeks`.
  - `weekLabels(weeks: number): string[]`: nhãn ngày, tuần cuối là 2/11/2026 (lùi 7 ngày mỗi tuần). Thay cho `WEEK_LABELS`.
  - `computeOverview(ind: string, sel: string | null, f: Filters)`: giữ nguyên các trường đang trả về. Thay đổi:
    - `gr` = % thay đổi lương trung vị kỳ này so với kỳ trước, chia 100.
    - `disc` = trung bình `disclosed` có trọng số theo số tin.
    - `S = null` nếu `sel` không có trong `G`.
    - `city` trả về là `f.city`.
- `TrendLine` nhận thêm prop `labels: string[]` (thay cho `WEEK_LABELS`).

- [ ] **Step 1: Viết test lỗi** `overview.test.ts`:
  - `getGroups('all', DEFAULT_FILTERS).length === 3`. `getGroups('it', DEFAULT_FILTERS).length === 6`.
  - Tổng `jobs` của `getGroups('it', f)` bằng `jobs` của nhóm `it` trong `getGroups('all', f)`.
  - `getSeries('it', {...DEFAULT_FILTERS, weeks: 24}).cur.length === 24`.
  - `computeOverview('it', 'khong-ton-tai', DEFAULT_FILTERS).S === null`.
  - `weekLabels(12).at(-1) === '2/11'`.
- [ ] **Step 2:** Chạy `npm test`. Kết quả mong đợi: FAIL.
- [ ] **Step 3:** Sửa các file. Các component Tổng quan đang đọc `IND[ind].fam`, `.cur`, `WEEK_LABELS` phải đổi sang hàm mới. `GroupMix` lấy tên chip từ `G`. `FilterBar` hiện `Nhóm: {tên}` thay vì id.
- [ ] **Step 4:** Chạy `npm test` và `npx tsc --noEmit`. Kết quả mong đợi: PASS và sạch.
- [ ] **Step 5: Checkpoint.**

### Task 7: Tầng API và hook `useApi`

**Files:**
- Create: `src/api/types.ts`, `src/api/index.ts`, `src/api/useApi.ts`
- Test: `src/api/__tests__/no-nan.test.ts`

**Interfaces:**
- Produces (`src/api/index.ts`, mọi hàm trả `Promise`):
  ```ts
  getOverview(ind: string, sel: string | null, f: Filters): Promise<OverviewData>
  getCompanies(f: Filters): Promise<Company[]>
  getCompany(id: number, f: Filters): Promise<CompanyDetail | null> // { company, peerRows, jobs, thin }
  getCareerRanking(ind: string, f: Filters): Promise<CareerRow[]>
  getTrend(groupId: string, f: Filters, metric: 'jobs' | 'salary'): Promise<TrendDetail | null>
  ```
  `TrendDetail` (khai trong `src/api/types.ts`):
  `{ group: { id; name; industryName }; labels: string[]; history: number[]; estimated: boolean[]; forecast: ForecastResult | null; enoughData: boolean; skills: SkillTrend[] }`.
  - `history` = `f.weeks` tuần cuối của `groupWeekly`, hoặc của lương × `salaryFactor`.
  - `estimated[i]` đúng nếu vị trí gốc nằm trong `ESTIMATED_WEEKS`.
  - `forecast` luôn tính trên 48 tuần đầy đủ, nên dùng 12 tuần gần nhất, không phụ thuộc `f.weeks`.
  - `SkillTrend = { name: string; sharePct: number; direction: Direction }`. Tỷ trọng lấy từ `IND[industry].sk` nhân một hệ số cố định theo nhóm. Hướng đi = dự báo trên chuỗi tỷ trọng 48 tuần, sinh cố định trong `src/data/series.ts`.
- `useApi<T>(load: () => Promise<T>, deps: unknown[]): { data: T | null; loading: boolean; error: string | null }`. Dùng `useEffect` + biến `daHuy` để bỏ kết quả cũ khi `deps` đổi.
- Comment đầu `index.ts`: "Khi có backend Python, thay ruột từng hàm bằng fetch tới API, giữ nguyên kiểu trả về."

- [ ] **Step 1: Viết test lỗi** `no-nan.test.ts`: lặp mọi tổ hợp `weeks` ∈ {4,12,24} × `city` ∈ {all,hn,dn,hcm} × `level` ∈ {all + 6 cấp} × `mode` ∈ {all + 3}, và `ind` ∈ {all,it,kt,mk}. Gọi `getOverview`, `getCompanies`, `getCompany(0)`, `getCareerRanking`, và `getTrend` cho mỗi id nhóm với cả 2 metric. Dùng hàm `timSoXau(obj)` duyệt đệ quy, gom mọi số `NaN` hoặc `Infinity`. Assert danh sách rỗng.
- [ ] **Step 2:** Chạy `npm test`. Kết quả mong đợi: FAIL.
- [ ] **Step 3:** Viết `src/api/*`.
- [ ] **Step 4:** Chạy `npm test`. Kết quả mong đợi: PASS. Nếu phát hiện số xấu thì sửa ở hàm gốc trong `src/lib`, không sửa ở tầng api.
- [ ] **Step 5: Checkpoint.**

### Task 8: Bộ lọc chung và nối các trang cũ vào API

**Files:**
- Modify: `src/context/FilterContext.tsx` (thêm `weeks`/`setWeeks`, `level`/`setLevel`, `mode`/`setMode`, và `filters: Filters` gộp sẵn)
- Create: `src/components/ui/FilterSelects.tsx` (3 ô `<select>`: "4 / 12 / 24 tuần gần nhất", "Mọi cấp bậc" + `LEVELS`, "Mọi hình thức" + `WORK_MODES`)
- Modify: `src/components/overview/FilterBar.tsx` (bỏ 2 select bị khóa, dùng `FilterSelects`, thêm chip cho cấp bậc và hình thức)
- Modify: `src/components/companies/CompanyFilters.tsx` (bỏ select bị khóa, dùng `FilterSelects`, thêm chip)
- Modify: `src/app/overview/page.tsx`, `src/app/companies/page.tsx`, `src/app/companies/[id]/page.tsx` (dùng `useApi` + `src/api`, có trạng thái đang tải và lỗi)
- Modify: các component con đang nhận `city` sang nhận `Filters` hoặc dữ liệu đã tính sẵn: `HotCompanies`, `TrendCard`, `ProfileJobs`, `ProfileSalary`, `ProfileTrend`, `ProfileKpis`, `CompanyTable`. Phụ đề "12 tuần gần nhất" đổi theo `weeks`.
- Modify: `src/app/companies/[id]/page.tsx`: thanh "Đang xem" hiện thêm chip cấp bậc và hình thức, và có `FilterSelects`.

**Interfaces:**
- Consumes: `src/api/*` (Task 7), `Filters`, `LEVELS`, `WORK_MODES` (Task 1).
- Produces: `useFilters()` trả thêm `weeks`, `setWeeks`, `level`, `setLevel`, `mode`, `setMode`, `filters`. Các trường cũ giữ nguyên.
- Đổi ngành trên Tổng quan thì bỏ chọn `sel` (đã có sẵn). Đổi bộ lọc khác thì giữ `sel`. Nếu `S` là `null` thì UI coi như chưa chọn.

- [ ] **Step 1:** Sửa `FilterContext` và tạo `FilterSelects`.
- [ ] **Step 2:** Nối trang Tổng quan và các component con.
- [ ] **Step 3:** Nối trang Công ty và Hồ sơ công ty.
- [ ] **Step 4:** Chạy `npx tsc --noEmit`, `npm test`, `npm run build`. Kết quả mong đợi: sạch, PASS, build thành công.
- [ ] **Step 5: Kiểm tra tay** với `npm run dev`. Ở `/overview`, `/companies`, `/companies/0`: đổi từng bộ lọc (24 tuần, Senior, Remote, Đà Nẵng). Số phải đổi theo. Đối chiếu với mốc trong "Cấu trúc file": không mất thẻ nào, không có NaN.
- [ ] **Step 6: Checkpoint.**

### Task 9: Nhãn độ tin cậy dùng chung

**Files:**
- Create: `src/components/ui/Reliability.tsx`
- Modify: `src/styles/overview.css` và `src/styles/company.css` (class `.badge`, `.badge.est`, `.badge.fc`, `.nen`). Nếu dùng chung ở nhiều trang thì đặt vào `globals.css`.
- Modify: `SalaryRanges`, `DemandVsSalary`, `GroupMix`, `InsightsCard` (thay `n < 30` viết cứng bằng `MIN_SAMPLE`). Thêm `SampleSize` vào phụ đề các thẻ tổng hợp trên Tổng quan.

**Interfaces:**
- Produces:
  - `SampleSize({ n }: { n: number })`: hiện "n = {n} tin".
  - `NotEnough({ n }: { n: number })`: hiện "Chưa đủ dữ liệu" và tooltip "Chỉ có {n} tin, cần ít nhất 30".
  - `StatusBadge({ kind }: { kind: 'estimate' | 'forecast' })`: hiện "Ước lượng" hoặc "Dự báo". Tooltip: "Dựng lại từ tin còn mở, có thể thiếu tin đã đóng" / "Dự báo bằng đường xu hướng, không phải số thật".

- [ ] **Step 1:** Viết `Reliability.tsx` và CSS.
- [ ] **Step 2:** Thay mọi chỗ viết cứng `30` bằng `MIN_SAMPLE`. Kiểm bằng `grep -rn "< 30" src` (chỉ còn trong test, nếu có).
- [ ] **Step 3:** Chạy `npx tsc --noEmit` và `npm run build`. Kết quả mong đợi: sạch.
- [ ] **Step 4: Checkpoint.**

### Task 10: Trang Xu hướng (`/trends`)

**Files:**
- Modify: `src/components/layout/TopNav.tsx` (tab thành: Tổng quan · Xu hướng · Công ty)
- Create: `src/app/trends/page.tsx`, `src/styles/trends.css` (class gốc `.tr`, theo style `.ov`)
- Create: `src/components/trends/CareerTable.tsx`, `src/components/trends/TrendDetail.tsx`, `src/components/trends/SkillTrends.tsx`
- Create: `src/components/charts/ForecastChart.tsx`

**Interfaces:**
- Consumes: `getCareerRanking`, `getTrend` (Task 7). `FilterBar` (Task 8, dùng lại trên trang này với `sel = null`). `Reliability` (Task 9).
- `CareerTable({ rows, selectedId, onSelect, sortKey, desc, onSort })`:
  - Các cột: Hạng, Nghề (kèm tên ngành khi xem tất cả ngành), Điểm, Hướng đi, Nhu cầu, Lương, % nhận người mới, Số công ty, Ngày mở TB, rồi câu giải thích ở dòng phụ.
  - Sắp được theo các cột số. Mặc định sắp theo điểm.
  - Dòng thiếu dữ liệu: hiện `NotEnough` ở ô Điểm.
  - Chú thích dưới bảng ghi trọng số đúng như `WEIGHTS`, và ghi "Độ khó tuyển chỉ để tham khảo, không tính vào điểm".
- `ForecastChart({ labels, history, estimated, forecast, unit })`:
  - Dùng Recharts `ComposedChart`, một trục y.
  - Phần lịch sử là `Line` màu `var(--acc)`. Đoạn ước lượng vẽ bằng một `Line` thứ hai cùng màu, `strokeOpacity 0.45`. Hai đoạn nối liền tại điểm chuyển.
  - Phần dự báo là `Line` nét đứt `strokeDasharray="5 4"`, kèm `Area` vùng mờ giữa `lo` và `hi` (dạng range `[lo, hi]`, `fillOpacity 0.15`).
  - Có một `ReferenceLine` dọc ở tuần hiện tại, nhãn "Hôm nay".
  - Nhãn trục x của phần dự báo: "+1t" … "+12t".
  - Tooltip phân biệt rõ "Thật", "Ước lượng", "Dự báo (khoảng lo–hi)".
  - `forecast === null` thì không vẽ phần dự báo, hiện dòng "Chưa đủ dữ liệu để dự báo".
- `TrendDetail`:
  - Nút chuyển "Số tin" / "Lương trung vị".
  - Ô bên phải hiện nhãn hướng đi bằng chữ kèm mũi tên (▲ Đang lên / ▶ Đi ngang / ▼ Đang xuống), mức chắc chắn và `StatusBadge kind="forecast"`.
  - Dòng "Dự báo trước đây sai khoảng ±{backtestErrorPct}%". Không hiện dòng này nếu giá trị là `null`.
  - Có một câu giải thích lấy từ `CareerRow.sentence`.
- `SkillTrends({ skills })`: danh sách kỹ năng, mỗi kỹ năng có thanh tỷ trọng và nhãn hướng đi bằng chữ.
- Trang: chọn mặc định dòng đầu bảng. Bấm dòng nào thì `TrendDetail` đổi sang nghề đó. Đổi bộ lọc mà nghề đang chọn không còn thì quay về dòng đầu.

- [ ] **Step 1:** Viết `ForecastChart`. Kiểm tra bằng trang tạm hoặc bằng trang thật ở Step 3.
- [ ] **Step 2:** Viết `CareerTable`, `TrendDetail`, `SkillTrends`, CSS.
- [ ] **Step 3:** Viết `src/app/trends/page.tsx` và thêm tab vào `TopNav`.
- [ ] **Step 4:** Chạy `npx tsc --noEmit`, `npm test`, `npm run build`. Kết quả mong đợi: sạch, PASS, build thành công, có route `/trends`.
- [ ] **Step 5: Kiểm tra tay** với `npm run dev` tại `/trends`:
  - Bảng có 15 dòng ở "Tất cả ngành", Data (IT) có nhãn Đang lên, Mobile có nhãn Đang xuống.
  - Ở chế độ 24 tuần thấy đoạn ước lượng tô nhạt. Ở chế độ 4 tuần vẫn có dự báo.
  - Chuyển sang "Lương trung vị" thì nhãn hướng đi tính lại.
  - Kiểm cả giao diện sáng và tối, và màn hình hẹp 375px không bị cuộn ngang.
- [ ] **Step 6: Checkpoint.**

### Task 11: Kiểm tra tổng

- [ ] **Step 1:** Chạy `npx tsc --noEmit && npm test && npm run build`. Kết quả mong đợi: cả ba sạch, PASS, thành công.
- [ ] **Step 2:** Đối chiếu từng trang với mốc trong "Cấu trúc file" ở chế độ mặc định và ở tổ hợp hẹp nhất (Đà Nẵng + Intern + Remote + 4 tuần). Không mất thẻ nào. Không có NaN, ô trống hay lỗi.
- [ ] **Step 3:** Cập nhật `README.md`: thêm trang Xu hướng, thư mục `src/api/` (cách thay bằng backend), lệnh `npm test`. Bỏ dòng nói các bộ lọc bị khóa.
- [ ] **Step 4: Checkpoint cuối.**
