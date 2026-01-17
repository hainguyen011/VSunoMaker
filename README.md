# Suno Hit-Maker AI

**Suno Hit-Maker AI** là một Chrome Extension mạnh mẽ giúp tự động hóa quy trình sáng tác nhạc trên [Suno.com](https://suno.com). Với sự hỗ trợ của trí tuệ nhân tạo (Gemini API), extension mang đến tư duy nhạc lý chuyên sâu, giúp bạn tạo ra những bản hit chất lượng cao chỉ trong vài giây.

## 🌟 Tính Năng Nổi Bật

*   **Sáng Tác Thông Minh (AI Powered)**: Tự động tạo lời bài hát (Lyrics) và phong cách âm nhạc (Style) dựa trên ý tưởng (Concept) của bạn.
*   **Tùy Chỉnh Chuyên Sâu**: Hỗ trợ nhiều tùy chọn để định hình bài hát:
    *   **Concept**: Ý tưởng, chủ đề bài hát.
    *   **Vibe**: Cảm xúc, không khí của bài hát (VD: V-Pop Viral, Ballad, EDM...).
    *   **Artist**: Mô phỏng phong cách của nghệ sĩ cụ thể.
    *   **Voice Customization**: Tùy chọn Giới tính (Nam/Nữ) và Vùng miền (Bắc/Trung/Nam/Hải ngoại) cho giọng hát.
*   **Studio Mode (Inspector)**: Công cụ chọn phần tử thông minh cho phép bạn "chỉ định" chính xác ô nhập liệu Lyrics và Style trên giao diện Suno, đảm bảo hoạt động ổn định ngay cả khi Suno cập nhật giao diện.
*   **Nút Tái Tạo Nhanh (Quick Regenerate)**: Hiển thị nút "Regenerate" ngay trên giao diện web, cho phép bạn thay đổi lời hoặc phong cách ngay lập tức mà không cần mở lại Popup.
*   **Auto-Fill**: Tự động điền nội dung đã tạo vào các ô nhập liệu tương ứng trên Suno.

## 🚀 Cài Đặt

Vì đây là extension đang trong quá trình phát triển (Developer Mode), bạn cần cài đặt thủ công:

1.  Tải hoặc Clone thư mục source code của extension về máy.
2.  Mở trình duyệt Google Chrome (hoặc Edge, Brave...).
3.  Truy cập địa chỉ: `chrome://extensions/`
4.  Bật chế độ **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.
5.  Nhấn vào nút **Load unpacked** (Tải tiện ích đã giải nén).
6.  Chọn thư mục **Suno-Hit-Maker** (thư mục chứa file `manifest.json`).

## 📖 Hướng Dẫn Sử Dụng

### 1. Cấu Hình Ban Đầu
*   Click vào icon **Suno Hit-Maker AI** trên thanh công cụ trình duyệt.
*   Nhập **Gemini API Key** của bạn (Lấy tại Google AI Studio).
*   Nhấn **Save** để lưu cấu hình.

### 2. Sáng Tác Nhạc
*   Mở Popup extension.
*   Nhập **Concept** (VD: "Một bài tình ca mùa đông buồn").
*   Chọn các tùy chọn **Vibe**, **Artist**, **Gender**, **Region**.
*   Nhấn **MAKE HIT!**. AI sẽ tạo nội dung và tự động điền vào Suno.

### 3. Sử dụng Studio Mode (Inspector)
Nếu extension không tự điền đúng ô, hãy dùng chế độ này:
*   Trong Popup, nhấn nút biểu tượng tiêu điểm (🎯) bên cạnh mục "Lyrics" hoặc "Style".
*   Di chuột vào ô nhập liệu tương ứng trên trang web Suno.
*   Click chuột trái để "khóa" mục tiêu. Extension sẽ ghi nhớ vị trí này cho các lần sau.

### 4. Tái Tạo Nhanh (Regenerate)
*   Khi đã xác định được ô nhập liệu (qua Inspector hoặc tự động), một khung viền highlight sẽ xuất hiện quanh ô đó.
*   Click vào nút **↻ (Regenerate)** trên khung viền để yêu cầu AI viết lại nội dung mới cho riêng ô đó (chỉ đổi lời hoặc chỉ đổi style).

## ⚠️ Lưu Ý
*   Extension yêu cầu quyền truy cập `https://suno.com/*` để hoạt động.
*   Cần có kết nối mạng để gọi Gemini API.

---
*Developed by Anton*
