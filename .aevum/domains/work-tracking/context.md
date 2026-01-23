# Domain: Song Tracking & History

## 📝 Mục tiêu
Quản lý việc theo dõi các bài hát được tạo ra trên Suno và lưu trữ lịch sử tác phẩm của người dùng (Work Tracking).

## 📂 Thành phần chính
- `src/content/suno-inject.js`: Phần logic `initSongTracking`, `scanForNewSongs`.
- Storage: Sử dụng `chrome.storage.local` với các key `created_works`, `tracked_song_ids`.

## 🛠 Trạng thái hiện tại
- Tự động quét và nhận diện bài hát mới sau khi "Create".
- Lưu trữ metadata: Title, Thumbnail, URL, Concept, Vibe...
