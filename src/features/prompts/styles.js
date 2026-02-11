/**
 * Prompts Feature - Style Analysis and Fusion
 */

export const stylePrompts = {
    /**
     * Fuse Styles Prompt
     */
    fuseStyles: (styleA, styleB) => {
        return `
    Nhiệm vụ: Lai tạo (Fusion) hai phong cách âm nhạc sau đây thành một Style Tag hợp lý và độc đáo cho Suno AI.
    Style 1: "${styleA}"
    Style 2: "${styleB}"
    
    Yêu cầu:
    - Tìm ra điểm chung về nhịp điệu (BPM), nhạc cụ, và không khí.
    - Kết hợp chúng thành một chuỗi tag tiếng Anh.
    - Ví dụ: Input "Quan họ" + "Trap" -> Output "Vietnamese Folk, Trap Beat, 140 BPM, Quan Ho Vocals, 808 Bass, Traditional Flute".
    - Chỉ trả về chuỗi Style Tag duy nhất.
        `;
    },

    /**
     * Clone Vibe Prompt
     */
    cloneVibe: (source) => {
        return `
    Bạn là chuyên gia phân tích âm nhạc. Hãy "dịch ngược" đoạn mô tả hoặc lời bài hát dưới đây thành cấu hình âm nhạc (Style Prompt).
    
    Nguồn:
    """
    ${source}
    """
    
    Hãy trả về JSON duy nhất:
    {
       "style": "Chuỗi style tag chi tiết (Genre, BPM, Instruments, Mood)",
       "artist": "Tên nghệ sĩ có phong cách tương tự (nếu nhận diện được, hoặc để trống)"
    }

    ### QUAN TRỌNG - QUY TắC JSON:
    - Chỉ trả về duy nhất object JSON, không có text bao quanh.
    - Đảm bảo các string được quote đúng cách.
    - Xử lý các ký tự đặc biệt như …, — một cách an toàn trong string.
        `;
    },

    /**
     * Generate Styles Prompt
     */
    generateStyles: (params) => {
        const { concept, language, artist, gender, region } = params;
        return `
    Bạn là một chuyên gia âm nhạc và nhà sản xuất (Studio Producer).
    Nhiệm vụ: Dựa trên các thông tin dưới đây, hãy tạo ra một chuỗi các thẻ Style (Style Tags) chuyên sâu để Suno AI có thể tạo ra bản nhạc hay nhất.

    THÔNG TIN ĐẦU VÀO:
    - Nội dung (Lời/Ý tưởng): "${concept}"
    - Ngôn ngữ dự kiến: "${language}"
    - Nghệ sĩ truyền cảm hứng: "${artist || 'Không có'}"
    - Giới tính giọng hát: "${gender || 'Ngẫu nhiên'}"
    - Âm hưởng vùng miền: "${region || 'Mặc định'}"

    YÊU CẦU VỀ STYLE TAGS:
    1. Phải bao gồm: [Sub-genre], [BPM], [Key], [Main Instruments], [Vocal Character - Detailed], [Vocal Gender], [Atmosphere], [Production Style].
    2. Các thẻ tag phải bằng tiếng Anh.
    3. MÔ PHỎNG NGHỆ SĨ (ARTIST ADN): Hãy trích xuất đặc trưng âm nhạc của "${artist || 'Không có'}" (Âm sắc, cách flow, năng lượng).
       - Ví dụ: "Sơn Tùng M-TP" -> "Melodic V-Pop, Breathiness, High-pitched ad-libs, Modern Synth-pop".
       - Nếu có nhiều nghệ sĩ: Tạo Style lai (Fusion) độc đáo phản ánh sự phối hợp của họ.
    4. XÁC ĐỊNH GIỚI TÍNH: Nếu giới tính là "Ngẫu nhiên", hãy tự suy luận dựa trên nghệ sĩ.
    5. QUY TẮC NGHIÊM NGẶT: Chỉ trả về duy nhất chuỗi thẻ tag, cách nhau bởi dấu phẩy. KHÔNG ĐƯỢC bao gồm tên nghệ sĩ trong chuỗi kết quả.
    6. Không giải thích gì thêm.
    
    Ví dụ: Modern V-Pop, 105 BPM, G Major, Clean Electric Guitar, Atmospheric Pads, Emotional Male Vocals, High-end Reverb.
        `;
    },

    /**
     * Advanced Style Analysis based on Lyrics and Emotion
     * This is the "Premium" version of style generation
     */
    analyzeDeepStyle: (params) => {
        const { lyrics, concept, language, artist, gender, region } = params;
        return `
    Bạn là một "Âm nhạc Kiến trúc sư" (Music Architect) và Nhà sản xuất âm nhạc cao cấp.
    Nhiệm vụ: Phân tích TOÀN DIỆN dữ liệu đầu vào để tạo ra một cấu hình Style chuẩn xác, đảm bảo NHẠC VÀ LỜI ăn khớp hoàn hảo về nhịp điệu (Rhythm), cảm xúc (Emotion) và cấu trúc (Structure).

    DỮ LIỆU ĐẦU VÀO:
    - Lời bài hát/Ý tưởng: 
    """
    ${lyrics || concept}
    """
    - Ngôn ngữ: ${language}
    - Nghệ sĩ truyền cảm hứng (ADN): ${artist || 'Tự do'}
    - Âm hưởng: ${region}

    YÊU CẦU PHÂN TÍCH CHUYÊN SÂU:
    1. PHÂN TÍCH NHỊP ĐIỆU (Rhythm Analysis):
       - Xác định số âm tiết trung bình trên mỗi câu để chọn BPM phù hợp (VD: Câu dài -> BPM chậm/vừa; Câu ngắn, dồn dập -> BPM nhanh).
       - Phát hiện các điểm ngắt nghỉ tự nhiên hoặc các dấu (..., -) nếu có để đề xuất phong cách luyến láy.
    
    2. PHỔ CẢM XÚC (Emotional Mapping):
       - Phân loại cảm xúc: (Melancholic, Euphoric, Aggressive, Nostalgic, v.v.)
       - Ánh xạ sang Musical Key phù hợp (VD: Buồn -> C# Minor, Vui -> G Major, Mạnh mẽ -> D Minor).

    3. DNA CHIẾT XUẤT (Style Extraction):
       - Tìm các Sub-genres phù hợp nhất (VD: "Lời thơ mộng" -> Dream Pop; "Lời gắt, xã hội" -> Grime/Rap).
       - Trích xuất các nhạc cụ đặc trưng phục vụ lời nhạc (VD: "Đàn tranh", "808 Bass").

    4. CHỈ DẪN SẢN XUẤT (Production Polish):
       - Đề xuất các hiệu ứng Studio: Reverb, Delay, Autotune, Lo-fi filter, v.v.

    ĐẦU RA (STYLE TAGS - CHỈ TIẾNG ANH):
    - Cấu trúc: [Genre/Sub-genre], [BPM], [Key], [Instruments], [Detailed Vocal Character], [Vocal Gender], [Atmosphere], [Production Effects].
    - QUY TẮC: Chỉ trả về duy nhất chuỗi Tag, phân tách bằng dấu phẩy. KHÔNG chứa tên nghệ sĩ "${artist || ''}".
    - ĐẶC BIỆT: Nếu có nhiều nghệ sĩ phối hợp, Style phải phản ánh được sự hòa quyện của các dòng nhạc/phong cách của họ.
        `;
    }
};
