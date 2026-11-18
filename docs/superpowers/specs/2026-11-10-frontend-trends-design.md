# Thiết kế: Bổ sung frontend (nền móng + Xu hướng & Dự báo + Nghề đáng đầu tư)

Ngày: 2026-11-10 · Trạng thái: bản nháp chờ duyệt

## 1. Mục đích

Làm xong frontend trước, vẫn dùng **dữ liệu mẫu**, để:
- Bạn sinh viên trả lời được câu hỏi *"nên đi hướng nào"*: nghề nào đang lên, có tiếp tục lên trong 3 tháng tới không, nghề nào dễ vào cho người mới.
- Khi có backend Python thì chỉ cần thay ruột tầng dữ liệu, giao diện không phải sửa.

Người dùng làm theo đề xuất gồm nhóm 1 (nền móng) và mục 4, 5 (Xu hướng & Dự báo, Nghề đáng đầu tư). Các mục khác (so sánh lương, kỹ năng đi cùng, ưu đãi công ty, so sánh công ty, trang kết quả phiên cào) **không làm lần này**.

## 2. Ràng buộc

- Giữ Next.js 14 + Recharts + CSS hiện có (`globals.css`, `overview.css`, `company.css`), giữ phong cách giao diện đang có.
- Code phải theo skill `writing-student-readable-code` (`.claude/skills/`): hàm ngắn, comment tiếng Việt, không mẹo khó.
- Biểu đồ theo skill `dataviz`: màu theo thực thể (dùng `--s1..--s6` đã có), có tooltip, không dùng hai trục y.
- Không thêm thư viện mới nếu không cần.
- Chỉ 3 thành phố: Hà Nội, Đà Nẵng, TP.HCM.

## 3. Phần A: Nền móng

### A1. Tầng dữ liệu giống API
- Thư mục mới `src/api/`. Mỗi trang lấy dữ liệu qua hàm trong này, ví dụ `getOverview(filters)`, `getCompanies(filters)`, `getCompany(id, filters)`, `getTrends(filters)`, `getCareerRanking(filters)`.
- Các hàm **trả về Promise** (giống gọi API thật), bên trong tạm thời đọc dữ liệu mẫu ở `src/data/`. Sau này chỉ cần đổi ruột thành `fetch(...)` tới backend Python.
- Kiểu dữ liệu trả về khai báo trong `src/api/types.ts`. Đây cũng là "hợp đồng" cho backend Python sau này.
- Một hook đơn giản `useApi(hamLayDuLieu, cacGiaTriPhuThuoc)` trả về `{ data, loading, error }`. Trang hiện trạng thái đang tải và lỗi.
- Trang Tổng quan, Công ty, Hồ sơ công ty chuyển sang dùng tầng này. Giao diện của chúng giữ nguyên.

### A2. Mở khóa bộ lọc
Thêm vào `FilterContext` và `FilterBar` (dùng chung cho mọi trang):
- **Thời gian:** 4 / 12 / 24 tuần gần nhất (mặc định 12). Kỳ trước = cùng số tuần liền trước đó.
- **Cấp bậc:** Tất cả / Intern / Fresher / Junior / Middle / Senior / Lead+.
- **Hình thức làm việc:** Tất cả / Onsite / Hybrid / Remote.

**Ba bộ lọc này phải chạy thật trên mọi trang** (người dùng đã chốt): Tổng quan, Xu hướng, Công ty, Hồ sơ công ty. Vì vậy:
- Dữ liệu mẫu và phần tính toán của Tổng quan (`computeOverview`, `getGroups`, `getSeries`) được làm lại trên bộ dữ liệu mới.
- Dữ liệu mẫu công ty cũng có chuỗi 48 tuần, tỷ trọng cấp bậc và tỷ trọng hình thức làm việc. "Đà tuyển", số tin và bảng vị trí đang mở trong hồ sơ công ty đều theo bộ lọc.
- Vì đụng vào các trang đang chạy: trước khi sửa, ghi lại danh sách các thẻ, cột và biểu đồ đang có trên từng trang làm mốc. Sau khi sửa, mọi trang phải build được, vẫn đủ các thẻ, cột, biểu đồ đó, và không có ô nào lỗi, trống hay ra NaN, với mọi tổ hợp bộ lọc. Giá trị số mẫu được phép đổi.
- Có test (thư viện test do người làm chọn) cho các hàm tính toán: lọc theo thời gian, cấp bậc, hình thức, dự báo, điểm xếp hạng.

Dữ liệu mẫu phải có đủ 48 tuần (24 tuần kỳ này + 24 tuần kỳ trước), cùng tỷ trọng theo cấp bậc và hình thức cho từng nhóm nghề. Số mô phỏng, cố định, không ngẫu nhiên mỗi lần tải.

### A3. Nhãn độ tin cậy dùng chung
- Component hiện **cỡ mẫu** ("n = 120 tin") ở các thẻ có số liệu tổng hợp.
- Dưới **30 tin** thì thay số bằng "Chưa đủ dữ liệu" *(ngưỡng là quyết định của mình, để thành hằng số dễ sửa)*.
- Nhãn **"Ước lượng"** cho số liệu dựng lại từ quá khứ, nhãn **"Dự báo"** cho phần dự báo. Kèm chú thích khi rê chuột.

## 4. Phần B: Trang "Xu hướng" (`/trends`)

Thêm tab vào thanh điều hướng: **Tổng quan · Xu hướng · Công ty**.

Bố cục từ trên xuống:

```
[Bộ lọc dùng chung: ngành · thời gian · thành phố · cấp bậc · hình thức]

[Bảng "Nghề đáng đầu tư"]              ← Phần C
  hạng | nghề | điểm | hướng đi | nhu cầu | lương | % nhận người mới | câu giải thích
  (bấm một dòng → biểu đồ bên dưới đổi sang nghề đó)

[Biểu đồ Xu hướng & Dự báo của nghề đang chọn]
  đường liền: số tin theo tuần (đoạn "ước lượng" tô nhạt hơn)
  đường nét đứt + vùng mờ: dự báo 12 tuần tới
  bên phải: nhãn Đang lên / Đi ngang / Đang xuống + mức chắc chắn (Cao/Trung bình/Thấp)
  dưới: "Dự báo trước đây sai khoảng ±X%" + câu giải thích

[Kỹ năng của nghề đang chọn: tỷ trọng hiện tại và hướng đi của từng kỹ năng]
```

### B1. Biểu đồ dự báo
- Lịch sử: theo bộ lọc thời gian (4/12/24 tuần).
- Dự báo: **12 tuần tới** (≈ 3 tháng), vẽ nét đứt, có vùng mờ thể hiện khoảng không chắc chắn. Vùng mờ rộng dần theo thời gian.
- Có thể chuyển giữa **Số tin** và **Lương trung vị**, mỗi lúc một chỉ số, không dùng hai trục.
- Chưa đủ 8 tuần dữ liệu thì không vẽ dự báo, hiện "Chưa đủ dữ liệu để dự báo".
- **Cách tính tạm ở frontend:** đường thẳng xu hướng (hồi quy tuyến tính) trên 12 tuần gần nhất. Vùng không chắc chắn = ± 1,5 lần độ lệch của dữ liệu quanh đường thẳng, tăng theo căn bậc hai số tuần ra xa. Để trong một file riêng `src/lib/forecast.ts`, comment rõ đây là bản tạm, sau này backend Python (statsmodels) sẽ thay.
- **"Dự báo trước đây sai khoảng ±X%":** giấu 4 tuần cuối, dự báo bằng cùng cách, so với số thật (backtest đơn giản).

### B2. Nhãn hướng đi
- **Đang lên:** dự báo 12 tuần tới cao hơn 12 tuần qua ít nhất 5%. **Đang xuống:** thấp hơn ít nhất 5%. Còn lại là **Đi ngang**.
- **Mức chắc chắn** dựa vào độ rộng vùng mờ so với giá trị dự báo: hẹp thì Cao, rộng thì Thấp. Ngưỡng là hằng số dễ sửa.
- Nhãn luôn đi kèm chữ, không chỉ dùng màu.

## 5. Phần C: Bảng "Nghề đáng đầu tư"

Mỗi dòng là một nhóm nghề, trong ngành đang chọn hoặc tất cả ngành.

Năm tiêu chí, mỗi tiêu chí quy về thang 0–100 so với các nghề khác trong bảng:
1. **Đà nhu cầu:** số tin kỳ này so với kỳ trước.
2. **Đà lương:** lương trung vị kỳ này so với kỳ trước.
3. **Độ rộng:** số công ty khác nhau đang tuyển.
4. **Độ khó tuyển:** số ngày trung bình một tin còn mở. Mở lâu tức là khó tuyển, là cơ hội cho ứng viên.
5. **Thân thiện người mới:** % tin nhận Intern, Fresher hoặc Junior.

- **Điểm** = trung bình có trọng số. Mặc định: người mới 30%, nhu cầu 25%, dự báo hướng đi 20%, lương 15%, độ rộng 10%. Độ khó tuyển chỉ hiện để tham khảo, không cộng vào điểm *(trọng số là quyết định của mình)*. Trọng số hiện ở chú thích dưới bảng.
- Mỗi dòng có **một câu giải thích** sinh từ số liệu, ví dụ: "Data Engineer · TP.HCM: nhu cầu +18%, 42% tin nhận người mới, dự báo đang lên."
- Sắp xếp được theo từng cột. Mặc định sắp theo điểm.
- Bộ lọc cấp bậc: khi chọn một cấp, cột "% nhận người mới" vẫn tính trên tất cả cấp.

## 6. Dữ liệu mẫu cần thêm

Trong `src/data/`, cố định, không ngẫu nhiên:
- Chuỗi 48 tuần cho từng nhóm nghề (cả 3 ngành), có đà tăng hoặc giảm khác nhau để bảng xếp hạng có ý nghĩa. Có ít nhất một nghề đang lên, một nghề đi ngang, một nghề đang xuống, và một nghề có ít tin (để thấy "Chưa đủ dữ liệu").
- 12 tuần đầu đánh dấu là "ước lượng" (giả lập phần dựng lại từ quá khứ).
- Lương trung vị theo tuần, số công ty, số ngày tin mở, tỷ trọng cấp bậc, tỷ trọng hình thức làm việc cho từng nhóm nghề.
- Chuỗi tỷ trọng theo tuần cho từng kỹ năng.

## 7. Không làm

- Backend, extension, dữ liệu thật.
- Các mục đề xuất khác: so sánh lương, kỹ năng đi cùng, ưu đãi công ty, so sánh công ty, trang kết quả phiên cào.
- Mô hình dự báo có mùa hoặc học máy.

## 8. Điều phải tránh

- Dự báo trông như số thật. Luôn có nét đứt, vùng mờ, chữ "Dự báo".
- Con số từ quá ít dữ liệu mà không có cảnh báo.
- Code khó đọc với sinh viên năm 4.
- Làm hỏng các trang hiện có (Tổng quan, Công ty, Hồ sơ công ty phải chạy như cũ).

## 9. Các quyết định mình tự đưa ra (có thể đổi)

- **Một bộ dữ liệu mẫu duy nhất.** Dữ liệu 48 tuần mới thay cho các mảng 12 tuần và `fam` hiện tại. Trang Tổng quan tính từ bộ mới, nên số liệu mẫu trên Tổng quan có thể đổi so với bây giờ. Mục đích là để hai trang không bao giờ hiện số mâu thuẫn nhau.
- **"Nghề" = nhóm nghề** đang có (Web, Data, QA, DevOps, Mobile, Kế toán tổng hợp…), khoảng 18 dòng cho cả 3 ngành. Nhóm "Khác" không được xếp hạng. Thành phố trong câu giải thích là thành phố đang lọc, không tách dòng theo thành phố. Ví dụ đúng: "Data · TP.HCM: nhu cầu +18%…".
- **Tuần "ước lượng":** 12 tuần cũ nhất trong 24 tuần gần đây, giả lập việc mới bắt đầu cào đều từ 12 tuần trước. Ở chế độ xem 24 tuần sẽ thấy đoạn ước lượng tô nhạt.
- **Bộ lọc thời gian chỉ đổi phần lịch sử được hiển thị.** Dự báo và nhãn hướng đi luôn tính trên 12 tuần gần nhất, không phụ thuộc bộ lọc. Như vậy chế độ 4 tuần vẫn có dự báo.
- **Chế độ "Lương trung vị":** nhãn hướng đi, mức chắc chắn và dòng "sai khoảng ±X%" tính lại trên lương. Điểm xếp hạng luôn dùng **% thay đổi liên tục của dự báo số tin**, không dùng nhãn ba mức.

## 10. Để người làm tự quyết

- Chi tiết bố cục CSS, cách chia component.
- Cách sinh chuỗi dữ liệu mẫu, miễn là cố định và đủ đa dạng.
- Cách tính quy về thang 0–100 (min–max trong bảng là đủ).
