/**
 * Prompts Feature - Lyrics Refinement
 */

export const lyricPrompts = {
  /**
   * Polish Lyrics Prompt
   */
  polishLyrics: (params) => {
    const { lyrics, vibe, artist, language, region, isCleanLyrics } = params;
    return `
    Bạn là một chuyên gia ngôn ngữ và nhạc sĩ tài ba (Lyrics Polisher & Rhythm Specialist).
    Nhiệm vụ: Chỉnh sửa lời bài hát dựa trên TOÀN BỘ nội dung để đảm bảo tính kết nối, vần điệu (rhyme) và mạch cảm xúc (flow), đặc biệt chú trọng vào sự ổn định của NHỊP ĐIỆU (Rhythm Alignment).

    DỰ LIỆU NGỮ CẢNH:
    - Phong cách âm nhạc (Style): "${vibe || 'Pop'}"
    - Nghệ sĩ truyền cảm hứng: "${artist || 'Không có'}"
    - Ngôn ngữ: "${language || 'Tiếng Việt'}"
    - Âm hưởng vùng miền: "${region || 'Chuẩn'}"

    YÊU CẦU PHÂN TÍCH TOÀN CẢNH:
    1. Đọc toàn bộ lời bài hát để xác định "vần chủ đạo" (Global Rhyme Theme).
    2. PHÂN TÍCH NHỊP ĐIỆU: Kiểm tra số âm tiết (syllables) trong mỗi câu. Đảm bảo các câu trong cùng một đoạn (Verse/Chorus) có độ dài tương đồng hoặc có quy luật ngắt nghỉ hợp lý để Suno AI không bị "ép chữ".
    3. Phát hiện những câu bị gãy vần, lỗi nhịp hoặc không khớp với phong cách "${vibe}".
    4. HỆ THỐNG ĐIỀU HƯỚNG NHỊP ĐIỆU (RHYTHM PUNCTUATION):
       Sử dụng các dấu câu sau đây một cách chuyên nghiệp để điều khiển giọng hát Suno AI (Chỉ áp dụng nếu nhịp điệu "${params.rhythmFlow || 'default'}" yêu cầu):
       - "," (Dấu phẩy): Micro-pause. Tạo khoảng nghỉ cực ngắn (1/8 nhịp), giữ flow liên tục nhưng giúp ca từ rõ ràng hơn.
       - "..." (Dấu ba chấm): Sustain/Legato. Kéo dài nốt cuối của từ đứng trước, tạo không gian ngân vang, thường kích hoạt hiệu ứng Reverb/Delay tự nhiên.
       - "." (Dấu chấm): Terminate. Kết thúc câu dứt khoát, đóng vòng giai điệu, ngăn chặn việc luyến láy thừa.
       - "!" (Dấu chấm than): Dynamic Accent. Nhấn mạnh từ, tăng cường lực hát và năng lượng. Rất phù hợp cho Chorus hoặc Hook cao trào.

    5. PHONG CÁC NHỊP ĐIỆU YÊU CẦU: "${params.rhythmFlow || 'Mặc định'}"
       - Nếu là "ballad": Ưu tiên dùng "..." để tạo độ sầu muộn, trải dài.
       - Nếu là "rap": Dùng nhiều "," để tạo flow dồn dập, ngắt nghỉ nhanh.
       - Nếu là "epic": Dùng "!" ở những từ khóa quan trọng.

    YÊU CẦU ĐẦU RA (JSON ARRAY BẮT BUỘC):
    Bạn phải trả về một mảng JSON các đối tượng:
    [
      {
        "original": "Đoạn gốc (một câu hoặc cụm câu) bị lỗi/chưa hay",
        "suggested": "Đoạn đã được bạn chuốt lại hoàn chỉnh (đã căn chỉnh nhịp điệu)",
        "reason": "Giải thích tại sao sửa (vần điệu, số âm tiết, phong cách ${vibe})",
        "improvementScore": 85
      }
    ]

    ### QUAN TRỌNG - QUY TẮC JSON:
    - Trả về DUY NHẤT một mảng JSON hợp lệ, không có văn bản thừa.
    - Tất cả string phải được đặt trong dấu ngoặc kép.
    - Duy trì các ký tự đặc biệt (…, —) trong nội dung JSON mà không cần escape đặc biệt.
    ${isCleanLyrics ? '- TUYỆT ĐỐI KHÔNG sử dụng các dấu ba chấm (...) và dấu gạch ngang (-) trong lời bài hát. Hãy giữ lời nhạc sạch (Clean).' : '- Sử dụng các ký tự điều hướng nhịp điệu (…, —) một cách tinh tế để tạo điểm nhấn hoặc pause cho AI.'}
    - Đảm bảo tính hợp lệ của cấu trúc mảng JSON.

    Lời gốc của người dùng:
    """
    ${lyrics}
    """
    
    Lưu ý:
    - Nếu toàn bộ bài hát đã tốt, trả về mảng rỗng [].
    - Chỉ trả về duy nhất mảng JSON. Không có văn bản thừa.
        `;
  },

  /**
   * Regenerate Review Item Prompt
   */
  regenerateReviewItem: (params) => {
    const { original, currentSuggested, vibe, artist, language, region, isCleanLyrics } = params;
    return `
    Bạn là một chuyên gia ngôn ngữ và nhạc sĩ tài ba (Lyrics Polisher).
    Nhiệm vụ: Hãy tạo ra một PHƯƠNG ÁN KHÁC (Alternative) cho đoạn lời bài hát sau.

    NGỮ CẢNH:
    - Phong cách âm nhạc: "${vibe}"
    - Nghệ sĩ: "${artist}"
    - Ngôn ngữ: "${language}"
    - Vùng miền: "${region}"

    DỮ LIỆU HIỆN TẠI:
    - Đoạn gốc: "${original}"
    - Đã đề xuất trước đó: "${currentSuggested}"

    YÊU CẦU:
    1. Tạo ra một đề xuất MỚI hoàn toàn, không lặp lại cái cũ nhưng vẫn giữ đúng tinh thần và vần điệu.
    2. Nếu là ${vibe}, hãy tập trung vào các đặc trưng vần điệu của thể loại này.
    3. Trả về duy nhất đối tượng JSON:
    {
      "original": "${original}",
      "suggested": "Đề xuất mới của bạn",
      "reason": "Tại sao phương án này cũng hay hoặc khác biệt thế nào",
      "improvementScore": 90
    }

    ### QUAN TRỌNG - QUY TắC JSON:
    - CHỈ trả về một JSON object duy nhất.
    - Đảm bảo string kết quả không chứa các ký tự phá vỡ cấu trúc JSON.
    ${isCleanLyrics ? '- TUYỆT ĐỐI KHÔNG sử dụng các dấu ba chấm (...) và dấu gạch ngang (-) trong lời bài hát. Hãy giữ lời nhạc sạnh (Clean).' : '- Giữ nguyên các ký tự điều hướng nhịp điệu (…, —) trong chuỗi string JSON.'}
        `;
  }
};
