# Thiết kế: Thu thập dữ liệu tuyển dụng thật cho Hiring Intelligence

Ngày: 2026-11-09 · Trạng thái: bản nháp chờ duyệt

## 1. Mục đích và lý do

Dashboard hiện tại (Next.js 14 + Recharts) đã có giao diện Tổng quan và Công ty khá đầy đủ, nhưng **toàn bộ số liệu là dữ liệu mẫu**. Dự án này xây phần còn thiếu: lấy tin tuyển dụng thật từ các trang tuyển dụng, làm sạch, phân loại, lưu lại theo thời gian, rồi nối vào dashboard.

**Người dùng chính:** sinh viên và người tìm việc. Câu hỏi họ cần trả lời: *"Mình nên đi hướng nào?"*, tức là ngành, domain, kỹ năng nào đang lên và có tiếp tục lên trong vài tháng tới không. So sánh công ty (stack, outsource/product, ưu đãi, lương) là bước thứ hai, khi họ đã chọn hướng và cần chọn nơi nộp.

**Thành công là:** một sinh viên mở dashboard, thấy số liệu thật của Hà Nội, Đà Nẵng, TP.HCM theo tuần, và tin được các con số đó.

## 2. Những gì đã chốt

- **Nguồn:** các trang web tuyển dụng trước. Mạng xã hội để giai đoạn sau.
- **Phạm vi:** chỉ Hà Nội, Đà Nẵng, TP.HCM. Tin ở nơi khác bị loại ngay khi nhận.
- **Đa ngành:** không chỉ IT (hiện có IT, Kế toán, Marketing, sẽ mở rộng).
- **Cách cào:** người dùng mở trang tuyển dụng trên Chrome, dùng **extension Chrome** cào, extension **gửi dữ liệu sang một web/máy chủ khác** để lưu và xử lý.
- **Cào và phân tích khi được gọi:** chỉ khi người dùng đang ở trang tuyển dụng và bấm extension thì mới bắt đầu cào. Cào xong, máy chủ phân tích ngay, rồi **mở một trang mới** hiện kết quả phân tích của lần cào đó (xem 4.5). Không có chương trình chạy ngầm tự cào.
- **Ngành ngoài danh mục:** lưu hết. Tin không thuộc ngành đã định nghĩa thì xếp vào "Khác". Khi mở thêm ngành thì phân loại lại từ dữ liệu đã lưu.
- **Hosting:** dùng dịch vụ có gói miễn phí hoặc rẻ (Vercel + Neon/Supabase). Nếu vướng giới hạn thời gian chạy hoặc chi phí thì chuyển phần xử lý sang VPS tự thuê.
- **Người dùng extension:** trước mắt là nhóm nội bộ. *(Cách mình hiểu câu "cả 3 luôn": làm cả 3 phần extension, lưu trữ/xử lý, nối dashboard; và thiết kế sao cho sau này mở cho nhiều người cùng góp dữ liệu.)*
- **Làm sạch:** kết hợp quy tắc và AI (xem mục 5).
- **Giao diện:** giữ nguyên giao diện hiện có, giữ các kiểu dữ liệu trong `src/lib/types.ts` (hoặc mở rộng, không phá).

## 3. Mục tiêu, không làm, và điều phải tránh

**Mục tiêu**
1. Extension cào được trang danh sách và trang chi tiết tin của ít nhất một trang tuyển dụng, có chế độ tự lật nhiều trang kết quả.
2. Máy chủ nhận, lưu bản gốc, gộp tin trùng, chuẩn hóa, phân loại bằng quy tắc + AI.
3. Hồ sơ công ty: loại hình (Outsource / Product / Startup / In-house), lĩnh vực, stack, % onsite, ưu đãi.
4. Dashboard đọc số liệu thật: xu hướng theo tuần, tỷ trọng ngành/nhóm nghề/kỹ năng, lương P25/trung vị/P75, so sánh lương với vị trí tương đương, đà tuyển của công ty.
5. Đánh giá xu hướng và dự báo ngắn hạn (vài tháng) dựa trên nhu cầu thị trường.

**Không làm (giai đoạn này)**
- Cào mạng xã hội (Facebook group, LinkedIn…).
- Tài khoản người dùng cho người xem dashboard.
- Thành phố ngoài 3 thành phố trên.

**Điều phải tránh (làm vậy là hỏng dù code chạy được)**
- **AI bịa số.** Tin không ghi lương thì lương để trống, không đoán. Mọi trường do AI suy ra phải lưu kèm mức độ tin cậy.
- **Biểu đồ phản ánh việc "nhóm cào nhiều hay ít" thay vì thị trường.** Phải tính độ phủ cào mỗi tuần và cảnh báo khi độ phủ thấp.
- **Đếm trùng** một tin đăng trên nhiều trang hoặc đăng lại.
- **Bị trang tuyển dụng khóa** tài khoản hoặc IP của nhóm vì cào quá nhanh.
- **Lưu thông tin cá nhân** (số điện thoại, email người tuyển dụng). Không lưu.

## 4. Kiến trúc tổng thể

```
[Trang tuyển dụng trên Chrome]
        │  extension đọc DOM / dữ liệu có cấu trúc trong trang
        ▼
[Extension Chrome] ──gửi lô tin (JSON)──▶ [API nhận dữ liệu]
                                              │ lưu bản gốc
                                              ▼
                                        [CSDL: tin gốc]
                                              │ xử lý nền
                                              ▼
                     quy tắc → gộp trùng → AI phân loại → [CSDL: tin chuẩn hóa, công ty]
                                              │ tổng hợp theo tuần
                                              ▼
                                        [Số liệu tổng hợp] ──▶ [Dashboard Next.js hiện có]
```

### 4.1 Extension Chrome
- Mỗi trang tuyển dụng có một "bộ đọc" riêng (adapter), để thêm trang mới không đụng phần còn lại.
- Hai chế độ:
  - **Cào trang đang xem:** bấm nút, lấy các tin trên trang.
  - **Cào danh sách:** chọn bộ lọc trên trang (ví dụ "Kế toán, Hà Nội"), extension tự lật trang 1..N và mở trang chi tiết, có khoảng nghỉ ngẫu nhiên giống người thật và giới hạn số trang mỗi giờ.
- Ưu tiên đọc dữ liệu có cấu trúc trong trang (JSON-LD `JobPosting` nếu có), sau đó mới đọc HTML.
- Gửi theo lô lên API, kèm: nguồn, URL, thời điểm cào, phiên bản adapter, mã người cào.
- Hiển thị trong trang những tin đã cào (để không cào lại vô ích) và tổng số đã gửi hôm nay.
- Mỗi người cài có một mã (token) cá nhân. Hiện dùng cho nhóm nội bộ, sau này dùng để mở cho nhiều người.
- Mỗi lần bấm tạo một **phiên cào** (có mã phiên). Cào xong, extension mở tab mới tới trang kết quả của phiên đó.

### 4.5 Trang kết quả phiên cào (mới)
- Mở ngay sau khi cào. Hiện tiến độ trong lúc AI đang phân tích ("đã xử lý 40/120 tin").
- Nội dung: số tin lấy được, số tin trùng hoặc bị loại (ngoài 3 thành phố), phân bố ngành / nhóm nghề / cấp bậc, top kỹ năng, khoảng lương, danh sách công ty kèm loại hình và lĩnh vực, ưu đãi nổi bật, và độ phủ (số tin lấy được ÷ tổng trang báo).
- Có nút sang dashboard Tổng quan. Dữ liệu của phiên đồng thời được cộng dồn vào kho chung để vẽ xu hướng theo thời gian. *(Phần cộng dồn là cách mình hiểu, sửa nếu sai.)*
- Dùng lại style và component sẵn có (Card, biểu đồ Recharts).

### 4.2 Máy chủ nhận và lưu
- API nhận lô tin, kiểm tra token, kiểm tra định dạng, loại tin ngoài 3 thành phố.
- **Luôn lưu bản gốc** (HTML/text của phần tin + các trường đã đọc), để sau này sửa quy tắc hoặc prompt AI thì xử lý lại được mà không cần cào lại.
- Một tin được xác định bởi (nguồn, mã tin trên nguồn). Lần cào sau cùng tin chỉ cập nhật "lần thấy gần nhất", nhờ đó biết tin còn mở bao lâu.

### 4.3 Xử lý (chuẩn hóa)
Xem mục 5.

### 4.4 Tổng hợp và dashboard
- Tính sẵn số liệu theo (tuần × thành phố × ngành × nhóm nghề × cấp bậc), thay cho việc nhân hệ số giả ở `src/lib/cities.ts`, `src/data/*`.
- Dashboard gọi API lấy số liệu thay vì import từ `src/data/`. Mở khóa bộ lọc thời gian, cấp bậc, hình thức làm việc.
- Mỗi con số hiển thị kèm cỡ mẫu (n). Dưới ngưỡng tối thiểu thì hiện "Chưa đủ dữ liệu", giống `companyStatus` hiện tại.

## 5. Làm sạch dữ liệu: quy tắc trước, AI sau

| Việc | Cách làm | Ghi chú |
|---|---|---|
| Lương | Quy tắc tách "15–20 triệu", "Up to 2000$", "Thỏa thuận"… ra min/max/tiền tệ, quy đổi về triệu VND/tháng | "Thỏa thuận" = không có lương, không đoán |
| Thành phố, ngày đăng, hạn nộp | Lấy từ trường có cấu trúc | Chuẩn hóa tên ("HCM", "Sài Gòn" → hcm) |
| Gộp tin trùng | Cùng công ty (đã chuẩn hóa tên) + tiêu đề gần giống + thành phố + khoảng thời gian gần | Giữ liên kết tới mọi bản gốc |
| Ngành, nhóm nghề | AI phân loại vào danh mục cố định | Danh mục do mình định nghĩa, AI không tự tạo nhóm mới |
| Cấp bậc | Quy tắc từ tiêu đề/trường có sẵn, AI nếu mơ hồ | Intern / Fresher / Junior / Middle / Senior / Lead / Quản lý |
| Kỹ năng | AI trích từ mô tả, map về danh sách kỹ năng chuẩn | "ReactJS", "React.js" → React |
| Hình thức làm việc | Quy tắc + AI | Onsite / Hybrid / Remote |
| Ưu đãi | AI trích từ mô tả | Lương tháng 13, xét tăng lương mấy lần/năm, bảo hiểm, thưởng, đào tạo… |
| Loại hình + lĩnh vực công ty | AI đọc trang giới thiệu công ty **một lần cho mỗi công ty**, lưu kèm độ tin cậy và nguồn | Có thể sửa tay; nhãn tay thắng nhãn AI (khớp với trường `ev` "nguồn nhãn" đang có) |
| Stack công ty | Cộng dồn kỹ năng từ các tin của công ty đó | Không cần AI |

Nguyên tắc cho AI:
- Chỉ trích những gì có trong văn bản. Trả về dạng có cấu trúc cố định, trường nào không có thì để trống.
- Mỗi kết quả lưu kèm phiên bản prompt/model để biết dữ liệu nào cần xử lý lại.
- Chỉ xử lý tin mới hoặc tin thay đổi. Dùng model nhỏ, rẻ, xử lý theo lô.

## 6. Dữ liệu quá khứ (khoảng 3 tháng)

Trang tuyển dụng thường chỉ hiện tin **đang mở**, nên không lấy lại được đầy đủ 3 tháng trước. Cách xử lý:
- Tin còn mở có ngày đăng trong 3 tháng qua sẽ được dùng để **ước lượng** quá khứ. Dashboard phải ghi rõ đây là ước lượng, vì thiếu các tin đã đóng.
- **Bắt đầu tích lũy càng sớm càng tốt.** So sánh "3 tháng gần nhất" chỉ thật sự đúng sau khoảng 3 tháng cào đều.

## 7. Đánh giá xu hướng và dự báo

Các tiêu chí đánh giá một nghề/kỹ năng/domain (đề xuất, nhóm có thể chỉnh trọng số):
1. **Đà nhu cầu:** số tin 4 tuần gần nhất so với 4 tuần trước, và độ dốc 12 tuần.
2. **Đà lương:** trung vị lương thay đổi thế nào.
3. **Độ rộng:** bao nhiêu công ty khác nhau đang tuyển (10 công ty mỗi nơi 1 tin tốt hơn 1 công ty đăng 10 tin).
4. **Độ khó tuyển:** tin mở càng lâu thì càng khó tuyển, tức là cơ hội cho ứng viên.
5. **Độ thân thiện với người mới:** % tin nhận Intern/Fresher/Junior. Đây là tiêu chí quan trọng nhất với sinh viên.

**Dự báo vài tháng tới:** bắt đầu đơn giản (đường xu hướng kèm vùng không chắc chắn), chỉ hiện khi có tối thiểu 8 tuần dữ liệu. Ghi rõ đây là dự báo, không phải số thật.

## 8. Ý tưởng thêm (đề xuất, chưa được duyệt; chọn cái nào đưa vào thì đưa)

Cho sinh viên / người tìm việc:
- **Điểm "nghề đáng đầu tư"**: gộp 5 tiêu chí ở mục 7 thành một điểm, kèm giải thích bằng câu chữ ("Data Engineer ở TP.HCM: nhu cầu +18%, 42% tin nhận Junior").
- **Kỹ năng đang lên nhanh nhất**: kỹ năng có tỷ trọng tăng mạnh nhất, kể cả khi số tin còn nhỏ.
- **Bậc thang lương theo cấp bậc**: cùng một nghề, Fresher → Junior → Middle → Senior được trả bao nhiêu.
- **Bộ kỹ năng hay đi cùng nhau**: "Tin cần React thường cũng cần TypeScript, Node.js", giúp sinh viên biết nên học gì tiếp.
- **"Đúng domain"**: lọc job theo lĩnh vực công ty + hình thức onsite/remote (từ yêu cầu gốc "làm đúng domain → lấy job").

Cho chất lượng dữ liệu:
- **Bảng độ phủ cào**: mỗi tuần cào được bao nhiêu tin, ở trang nào, ngành nào. Nhìn vào là biết tuần nào số liệu yếu.
- **Lịch cào gợi ý** trong extension: nhắc nhóm cào những ngành/thành phố đang thiếu dữ liệu tuần này.
- **Trang duyệt nhãn**: xem nhanh các nhãn AI có độ tin cậy thấp, sửa tay bằng một cú bấm.

Sau này:
- Mở extension cho nhiều người góp dữ liệu (đã có token cá nhân; cần thêm giới hạn tốc độ, kiểm tra dữ liệu bất thường, và bảng xếp hạng người góp).
- Mạng xã hội: AI đọc bài đăng tự do. Dùng chung đường xử lý từ bước "lưu bản gốc" trở đi.
- Bản tin hằng tuần: "5 thay đổi lớn nhất của thị trường tuần này".

## 9. Các giai đoạn đề xuất

1. **Nền dữ liệu:** CSDL, API nhận lô tin, lưu bản gốc.
2. **Extension cho 1 trang** (đề xuất TopCV vì đa ngành): cào trang đang xem + cào danh sách, gửi về API.
3. **Xử lý:** quy tắc (lương, thành phố, cấp bậc), gộp trùng, AI phân loại ngành/kỹ năng/ưu đãi, hồ sơ công ty.
4. **Nối dashboard:** thay `src/data/*` bằng API, mở khóa bộ lọc, thêm cỡ mẫu và cảnh báo độ phủ.
5. **Xu hướng và dự báo:** các tiêu chí ở mục 7, so sánh lương với vị trí tương đương bằng số thật.
6. **Mở rộng:** thêm trang (VietnamWorks, CareerViet, Vieclam24h, ITviec, TopDev), rồi nhiều người góp, rồi mạng xã hội.

Mỗi giai đoạn chạy được và dùng được độc lập. Sau giai đoạn 2 là đã bắt đầu tích lũy dữ liệu.

## 10. Ràng buộc

- Giữ Next.js 14 + Recharts hiện có. Giữ hoặc mở rộng `src/lib/types.ts`.
- Cào với tốc độ giống người thật, chỉ dùng nội bộ. Tôn trọng điều khoản của từng trang ở mức có thể. Không lưu thông tin cá nhân.
- Chi phí AI phải nhỏ: chỉ xử lý tin mới hoặc tin thay đổi, phân tích mỗi công ty một lần.
- Thư mục dự án hiện chưa dùng git.

## 11. Các quyết định mình tự đưa ra (có thể đổi)

- **Máy chủ:** dùng luôn Next.js (route handlers) làm API nhận dữ liệu, thay vì dựng một backend riêng. Ít thứ phải vận hành.
- **CSDL:** PostgreSQL (chạy local khi phát triển, có thể dùng dịch vụ như Supabase/Neon khi triển khai), vì cần truy vấn tổng hợp theo tuần.
- **Extension:** Chrome Manifest V3, viết bằng TypeScript.
- **AI:** một model nhỏ, rẻ (ví dụ Claude Haiku) cho trích xuất có cấu trúc. Model cụ thể để người làm chọn. Chưa có ngân sách cụ thể: giả định nhóm tự tạo API key. Chi phí tăng theo số lần bấm, nên đặt **giới hạn số tin mỗi phiên** (mặc định 200, chỉnh được) và bỏ qua tin đã phân tích rồi.
- **Xử lý theo phiên trên Vercel:** API chia tin thành từng lô nhỏ cho AI, mỗi lần gọi chỉ xử lý một lô, để không vượt giới hạn thời gian của hàm serverless. Trang kết quả hỏi tiến độ định kỳ.
- **Trang đầu tiên:** TopCV (đa ngành, nhiều tin ở 3 thành phố).
- **Danh mục ngành/nhóm nghề/kỹ năng chuẩn:** khởi đầu từ danh mục đang có trong `src/data/overview.ts`, mở rộng dần.
- **Độ phủ cào:** khi cào trang kết quả tìm kiếm, extension ghi lại **tổng số kết quả mà trang báo** (theo bộ lọc, thành phố, ngày). Độ phủ = số tin đã lấy ÷ tổng trang báo. Con số này chỉ ghi được lúc cào, không lấy lại sau được, nên ghi ngay từ giai đoạn 2.
- **Trang công ty:** ở chế độ cào danh sách, extension mở trang công ty **một lần cho mỗi công ty mới** (bộ đọc có thêm loại trang thứ ba). Nếu không mở được thì phân loại tạm từ đoạn giới thiệu công ty trên trang tin. Máy chủ không tự đi cào, để tránh bị chặn IP.
- **Thông tin cá nhân:** extension xóa số điện thoại và email khỏi văn bản **trước khi gửi**. "Bản gốc" được lưu là bản đã xóa các thông tin này. Chấp nhận việc xử lý lại sau này sẽ chạy trên bản đã làm sạch.
- **"Số tin theo tuần":** là **tin mới**, tính theo ngày đăng nếu trang có, nếu không thì theo lần đầu thấy. Khớp với ý nghĩa "tin mới theo tuần" trong `src/lib/types.ts`. Ngoài ra lưu "tin đang mở trong tuần" (từ lần đầu thấy đến lần cuối thấy) để tính độ khó tuyển.

## 12. Để người làm tự quyết

- Thư viện truy cập CSDL, cách chạy xử lý nền (hàng đợi hay chạy định kỳ).
- Chi tiết thuật toán gộp tin trùng và ngưỡng giống nhau.
- Cấu trúc thư mục extension, cách đóng gói.
- Ngưỡng cỡ mẫu tối thiểu cho từng loại số liệu.
