# Thiết kế: Thu thập dữ liệu tuyển dụng thật cho Hiring Intelligence

Ngày: 2026-11-09 · Sửa lần 2: 2026-11-21 · Trạng thái: chờ chốt nguồn (xem mục 3)

> **Thay đổi ở lần sửa 2026-11-21**
> - Chỉ làm **ngành IT**. Bỏ Kế toán, Marketing.
> - Chuyển sang **cào tự động theo lịch trên VPS**. Cách cũ là extension Chrome do người bấm.
> - **Extension Chrome để sau**: chỉ dùng cho trang chặn cào từ máy chủ và cho mạng xã hội (mục 9). Chưa làm.
> - Hosting: chạy trên VPS sẵn có, bỏ phương án Vercel + Neon/Supabase.
> - Thêm kết quả kiểm tra thực tế từng nguồn (mục 3), trong đó có **điều khoản sử dụng**.

## 1. Mục đích và lý do

Dashboard hiện tại (Next.js 14 + Recharts) đã có giao diện Tổng quan, Xu hướng và Công ty, nhưng **toàn bộ số liệu là dữ liệu mẫu**. Phần cần xây là: lấy tin tuyển dụng IT thật, làm sạch, phân loại, lưu lại theo thời gian, rồi nối vào dashboard.

**Người dùng chính:** sinh viên và người tìm việc IT. Câu hỏi họ cần trả lời: *"Mình nên đi hướng nào?"*, tức là nhóm nghề, kỹ năng, domain nào đang lên và có tiếp tục lên trong vài tháng tới không. So sánh công ty (stack, outsource/product, ưu đãi, lương) là bước thứ hai.

**Thành công là:** một sinh viên mở dashboard, thấy số liệu IT thật của Hà Nội, Đà Nẵng, TP.HCM theo tuần, và tin được các con số đó.

**Vì sao chọn cào tự động:** điều tài liệu này sợ nhất là biểu đồ phản ánh việc "nhóm cào nhiều hay ít" thay vì thị trường. Cào theo lịch cố định quét cùng một phạm vi mỗi ngày, nên độ phủ ổn định và xu hướng theo tuần so sánh được với nhau. Extension phụ thuộc vào việc tuần đó có ai bấm hay không.

## 2. Những gì đã chốt

- **Ngành:** chỉ IT. Tin không phải IT trên trang nguồn thì bỏ qua, không lưu.
- **Phạm vi:** chỉ Hà Nội, Đà Nẵng, TP.HCM. Tin ở nơi khác bị loại khi nhận.
- **Cách cào:** chương trình chạy theo lịch trên VPS (mỗi đêm), mỗi nguồn có một adapter riêng.
- **Thứ tự nguồn:** chỉ làm trước những trang cho phép cào từ máy chủ. Trang chặn thì không lách (không dùng proxy dân dụng hay công cụ vượt Cloudflare), mà để cho extension sau này.
- **Làm sạch:** kết hợp quy tắc và AI (mục 6).
- **Giao diện:** giữ nguyên, giữ các kiểu dữ liệu trong `src/api/types.ts` và `src/lib/types.ts` (chỉ mở rộng, không phá).

## 3. Kiểm tra nguồn (2026-11-21)

Kiểm tra từ IP của VPS, mỗi trang vài request.

| Trang | robots.txt | Từ VPS | Cấu trúc dữ liệu | Điều khoản sử dụng |
|---|---|---|---|---|
| **ITviec** | Cho phép, sitemap `dunggiatminh.xml` | 200 | Sitemap `twinnings_jobs_desc_vn.xml` có ~590 tin đang mở. Trang tin có JSON-LD `JobPosting` đủ trường chính | **Mục 2.2 cấm** tải hoặc sao chép nội dung ngoài mục đích cá nhân khi chưa được đồng ý bằng văn bản |
| **VietnamWorks** | Không trả nội dung | 200 | Danh sách tải bằng JS, cần trình duyệt headless | **Cấm** sao chép, tái sử dụng nội dung (ngoại trừ bản sao hợp lý cho cá nhân) |
| **Vieclam24h** | Cho phép, có sitemap | 200 | Chưa kiểm tra trang tin. Tin IT ít hơn trang chuyên IT | Tìm theo từ khóa **không thấy điều khoản cấm cào** (chưa đọc toàn văn) |
| **CareerViet** | Không trả nội dung | 200 | Danh sách tải bằng JS | Chưa tìm thấy trang điều khoản |
| **TopDev** | Cho phép | **Hết thời gian chờ** (máy cá nhân vào được) | Nhiều khả năng chặn IP datacenter | Chưa kiểm tra |
| **TopCV** | Cho phép trang tin | **403 + thử thách Cloudflare** (từ máy cá nhân cũng bị) | Chặn client không phải trình duyệt | Chưa kiểm tra |

**Điểm cần chốt:** `robots.txt` cho phép **không có nghĩa là** điều khoản cho phép. Hai nguồn tốt nhất về kỹ thuật (ITviec, VietnamWorks) đều cấm trong điều khoản. Phương án:
- **A. Xin phép bằng văn bản** ITviec và VietnamWorks (email đối tác/hỗ trợ, nêu rõ dự án phi thương mại cho sinh viên, chỉ công khai số tổng hợp). Trong lúc chờ, chạy nguồn chưa thấy cấm (Vieclam24h).
- **B. Chấp nhận rủi ro:** cào ITviec chỉ lấy dữ kiện (chức danh, kỹ năng, thành phố, ngày đăng), chỉ công khai số tổng hợp, không đăng lại nội dung tin. Đây là cách làm phổ biến, nhưng vẫn là vi phạm điều khoản. Rủi ro là bị chặn IP hoặc nhận yêu cầu dừng.
- **C (đề xuất):** xây bộ máy cào chung kèm adapter ITviec, nhưng **tắt adapter ITviec cho đến khi có văn bản đồng ý**. Chạy Vieclam24h trước, gửi email xin phép song song.

*(Đây là đánh giá kỹ thuật, không phải tư vấn pháp lý.)*

**Hệ quả với dữ liệu ITviec (nếu được dùng):** lương bị ẩn khi chưa đăng nhập (JSON-LD ghi `"You'll love it"`), nên phần lớn tin không có lương. Một số tin ghi lương trong `jobBenefits` dạng chữ ("13 - 16 triệu/tháng"), có thể tách bằng quy tắc. Không đoán lương. Dashboard phải hiện tỷ lệ tin có lương.

## 4. Mục tiêu, không làm, và điều phải tránh

**Mục tiêu**
1. Crawler chạy mỗi đêm trên VPS, lấy tin IT mới và đánh dấu tin đã đóng của các nguồn được phép.
2. Lưu bản gốc, gộp tin trùng (giữa các nguồn và tin đăng lại), chuẩn hóa, phân loại bằng quy tắc + AI.
3. Hồ sơ công ty: loại hình (Outsource / Product / Startup / In-house), lĩnh vực, stack, % onsite, ưu đãi.
4. Dashboard đọc số liệu thật: xu hướng theo tuần, tỷ trọng nhóm nghề / kỹ năng, lương P25/trung vị/P75 (khi đủ mẫu), đà tuyển của công ty.
5. Xu hướng và dự báo ngắn hạn (vài tháng).

**Không làm (giai đoạn này)**
- Ngành ngoài IT.
- Extension Chrome, mạng xã hội (để ở mục 9).
- Tài khoản người dùng cho người xem dashboard.
- Thành phố ngoài 3 thành phố trên.
- Lách cơ chế chặn của bất kỳ trang nào.

**Điều phải tránh (làm vậy là hỏng dù code chạy được)**
- **AI bịa số.** Tin không ghi lương thì để trống. Mọi trường do AI suy ra phải lưu kèm mức độ tin cậy.
- **Đếm trùng** một tin đăng trên nhiều trang hoặc đăng lại.
- **Bị chặn IP của VPS.** VPS còn chạy các dịch vụ khác, nên tốc độ cào phải thấp (mục 5.1).
- **Lưu thông tin cá nhân** (tên, số điện thoại, email người tuyển dụng). Không lưu.
- **Đăng lại nội dung tin.** Dashboard chỉ hiện số tổng hợp và link về tin gốc.

## 5. Kiến trúc

```
systemd timer trên VPS (mỗi đêm, giờ thấp điểm)
  → crawler (container, chạy xong thì thoát)
      mỗi nguồn một adapter:
        - sitemap → danh sách URL tin đang mở
        - so với lần trước: URL mới → tải trang tin; URL biến mất → đánh dấu đã đóng
        - đọc JSON-LD JobPosting; thiếu thì đọc HTML; trang tải bằng JS → Playwright
        - xóa SĐT/email → lưu bản gốc + các trường đã đọc
        - ghi "lần quét": nguồn, thời điểm, tổng URL trong sitemap, số tải được, số lỗi
  → xử lý: quy tắc → gộp trùng → AI phân loại (chỉ tin mới / thay đổi)
  → tổng hợp theo tuần
  → API đọc số liệu ──▶ dashboard Next.js (thay ruột src/api/index.ts)
```

### 5.1 Crawler
- **Adapter theo nguồn**, cùng một giao diện: `listOpenJobs()` trả danh sách URL kèm mã tin, `fetchJob(url)` trả các trường chuẩn và bản gốc. Thêm nguồn mới không đụng phần còn lại.
- **Mỗi adapter có cờ bật/tắt** trong cấu hình, kèm ghi chú lý do (ví dụ "chờ ITviec đồng ý").
- **Tốc độ:** mỗi nguồn tối đa 1 request mỗi 3–5 giây (có dao động ngẫu nhiên), một luồng. Lần đầu (~600 tin) mất khoảng 40 phút. Các đêm sau chỉ tải tin mới, vài phút.
- **User-Agent trung thực**, có tên dự án và link trang giới thiệu, để trang nguồn biết ai đang cào và liên hệ được.
- **Gặp 403, 429 hoặc trang thử thách:** dừng nguồn đó trong lượt quét, ghi lỗi, không thử lại dồn dập.
- **Độ phủ:** tổng URL trong sitemap là mẫu số. Độ phủ = số tin tải được ÷ tổng URL trong sitemap, ghi cho mỗi lần quét.

### 5.2 Lưu trữ
- PostgreSQL riêng cho dự án (container `job-analysis-db`), không dùng chung DB của dịch vụ khác trên VPS.
- Bảng chính:
  - `scan_run`: lần quét, theo nguồn, kèm độ phủ.
  - `raw_job`: bản gốc đã xóa thông tin cá nhân, khóa là (nguồn, mã tin). Có `first_seen`, `last_seen`, `closed_at`.
  - `job`: tin đã chuẩn hóa, liên kết về các bản gốc.
  - `company`: công ty và nhãn kèm độ tin cậy.
  - `weekly_stats`: số đã tổng hợp.
- **Luôn lưu bản gốc** để khi sửa quy tắc hoặc prompt có thể xử lý lại mà không cần cào lại.

### 5.3 Tổng hợp và dashboard
- Tính sẵn theo (tuần × thành phố × nhóm nghề × cấp bậc × hình thức), thay cho các hệ số giả ở `src/lib/cities.ts` và `src/data/*`.
- Dashboard gọi API thay vì import `src/data/`. Bỏ bộ chọn ngành (chỉ còn IT).
- Mỗi con số kèm cỡ mẫu (n). Dưới ngưỡng thì hiện "Chưa đủ dữ liệu".
- Build tĩnh hiện tại (`output: 'export'`) sẽ đổi thành: hoặc trang tĩnh gọi API qua `fetch` phía trình duyệt, hoặc bỏ export tĩnh. Quyết định khi nối dashboard.

## 6. Làm sạch dữ liệu: quy tắc trước, AI sau

| Việc | Cách làm | Ghi chú |
|---|---|---|
| Lương | Quy tắc tách "15–20 triệu", "Up to 2000$", "Thỏa thuận"… ra min/max/tiền tệ, quy đổi về triệu VND/tháng | Không có hoặc bị ẩn = để trống, không đoán |
| Thành phố, ngày đăng, hạn nộp | Lấy từ trường có cấu trúc (`addressRegion`, `datePosted`, `validThrough`) | Chuẩn hóa tên ("Hồ Chí Minh", "HCM" → hcm) |
| Gộp tin trùng | Cùng công ty (tên đã chuẩn hóa) + tiêu đề gần giống + thành phố + thời gian gần nhau | Giữ liên kết tới mọi bản gốc |
| Nhóm nghề IT | AI phân loại vào danh mục cố định (Web, Data, QA, DevOps, Mobile, Khác…) | AI không tự tạo nhóm mới |
| Cấp bậc | Quy tắc từ tiêu đề và số tháng kinh nghiệm, AI nếu mơ hồ | Intern / Fresher / Junior / Middle / Senior / Lead |
| Kỹ năng | Lấy trường `skills` nếu có, map về danh sách chuẩn. AI trích từ mô tả khi thiếu | "ReactJS", "React.js" → React |
| Hình thức làm việc | Quy tắc từ trang (ITviec: "Tại văn phòng" / "Linh hoạt" / từ xa) + AI | Onsite / Hybrid / Remote |
| Ưu đãi | AI trích từ mô tả và phần phúc lợi | Lương tháng 13, xét tăng lương, bảo hiểm, đào tạo… |
| Loại hình + lĩnh vực công ty | AI đọc trang công ty **một lần cho mỗi công ty**, lưu kèm độ tin cậy | Nhãn tay thắng nhãn AI |
| Stack công ty | Cộng dồn kỹ năng từ các tin của công ty | Không cần AI |

Nguyên tắc cho AI:
- Chỉ trích những gì có trong văn bản, trả về dạng có cấu trúc cố định, trường nào thiếu thì để trống.
- Lưu kèm phiên bản prompt/model.
- Chỉ xử lý tin mới hoặc tin thay đổi, theo lô, dùng model nhỏ (ví dụ Claude Haiku).

## 7. Dữ liệu quá khứ

Trang nguồn chỉ hiện tin **đang mở**. Tin còn mở có ngày đăng trong 3 tháng qua dùng để **ước lượng** quá khứ, và dashboard phải ghi rõ là ước lượng. **Bắt đầu tích lũy càng sớm càng tốt:** so sánh 3 tháng chỉ đúng sau khoảng 3 tháng cào đều.

## 8. Xu hướng và dự báo

Tiêu chí (trọng số chỉnh được, khớp `WEIGHTS` trong `src/lib/ranking.ts`):
1. **Đà nhu cầu:** tin 4 tuần gần nhất so với 4 tuần trước, và độ dốc 12 tuần.
2. **Đà lương:** trung vị lương thay đổi thế nào (chỉ khi đủ mẫu có lương).
3. **Độ rộng:** số công ty khác nhau đang tuyển.
4. **Độ khó tuyển:** tin mở càng lâu càng khó tuyển (từ `first_seen` đến `closed_at`).
5. **Thân thiện với người mới:** % tin Intern/Fresher/Junior.

Dự báo chỉ hiện khi có tối thiểu 8 tuần dữ liệu thật, và ghi rõ là dự báo.

## 9. Để sau: extension Chrome và mạng xã hội (chưa làm)

Dùng cho những nguồn **không cào được từ máy chủ**: TopCV, TopDev (chặn IP VPS hoặc chặn client không phải trình duyệt), các nguồn mà điều khoản không cho máy chủ cào, và mạng xã hội (Facebook group, LinkedIn).

- Người dùng tự mở trang trên Chrome và bấm extension, nên dữ liệu được đọc từ trình duyệt của chính người đó.
- Adapter riêng cho từng trang. Ưu tiên JSON-LD `JobPosting`, sau đó mới đọc HTML.
- Gửi lô tin về **cùng API nhận dữ liệu** của crawler. Từ bước "lưu bản gốc" trở đi, dữ liệu đi chung đường xử lý.
- Mỗi người cài có token cá nhân. Extension xóa SĐT và email trước khi gửi.
- Lưu ý về độ phủ: dữ liệu từ extension không đều theo tuần, nên phải gắn nhãn nguồn và tính độ phủ riêng, để không làm lệch xu hướng của phần cào tự động.
- Mạng xã hội: AI đọc bài đăng tự do. Cần thêm bước lọc tin trùng với tin trên trang tuyển dụng.

## 10. Các giai đoạn

1. **Chốt nguồn** (mục 3): chọn phương án A/B/C, gửi email xin phép nếu chọn A hoặc C.
2. **Nền:** PostgreSQL trên VPS, bảng `scan_run` / `raw_job`, khung crawler + adapter đầu tiên, systemd timer. Từ đây bắt đầu tích lũy dữ liệu.
3. **Xử lý:** quy tắc (lương, thành phố, cấp bậc, hình thức), gộp trùng, AI phân loại nhóm nghề / kỹ năng / ưu đãi, hồ sơ công ty.
4. **Nối dashboard:** API đọc số liệu, thay `src/data/*`, bỏ bộ chọn ngành, thêm cỡ mẫu và cảnh báo độ phủ.
5. **Thêm nguồn được phép:** mỗi nguồn một adapter. VietnamWorks, CareerViet cần Playwright.
6. **Xu hướng và dự báo** bằng số thật (sau ≥ 8 tuần dữ liệu).
7. **Để sau:** extension Chrome, mạng xã hội (mục 9).

## 11. Ràng buộc

- Giữ Next.js 14 + Recharts. Giữ hoặc mở rộng `src/api/types.ts` và `src/lib/types.ts`.
- Chạy trên VPS dùng chung. Crawler giới hạn RAM (Playwright khoảng 500MB), chạy giờ thấp điểm, không mở cổng ra ngoài.
- Tôn trọng `robots.txt` **và** điều khoản sử dụng. Không lách cơ chế chặn. Không lưu thông tin cá nhân.
- Chi phí AI nhỏ: chỉ xử lý tin mới hoặc thay đổi, phân tích mỗi công ty một lần.

## 12. Các quyết định kỹ thuật (có thể đổi)

- **Ngôn ngữ crawler:** TypeScript (Node), cùng repo với dashboard, để dùng chung kiểu dữ liệu và một bộ công cụ.
- **CSDL:** PostgreSQL 17 trong container, volume riêng, sao lưu hằng ngày bằng `pg_dump`.
- **Lịch chạy:** systemd timer gọi `docker compose run --rm crawler`. Không chạy thường trực.
- **"Số tin theo tuần":** là **tin mới**, tính theo `datePosted` nếu có, nếu không thì theo `first_seen`. Lưu thêm "tin đang mở trong tuần" để tính độ khó tuyển.

## 13. Để người làm tự quyết

- Thư viện truy cập CSDL và cách chạy migration.
- Chi tiết thuật toán gộp tin trùng và ngưỡng giống nhau.
- Ngưỡng cỡ mẫu tối thiểu cho từng loại số liệu.
