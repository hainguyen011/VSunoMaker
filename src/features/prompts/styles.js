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
    1. Phải bao gồm: [Sub-genre], [BPM], [Key], [Main Instruments], [Atmosphere], [Production Style].
    2. Các thẻ tag phải bằng tiếng Anh.
    3. Nếu nghệ sĩ được nhắc đến, hãy trích xuất đặc trưng âm nhạc của họ (VD: "Sơn Tùng M-TP" -> "Modern V-Pop, Melodic Rap, Synth-heavy").
    4. QUY TẮC NGHIÊM NGẶT: Chỉ trả về duy nhất chuỗi thẻ tag, cách nhau bởi dấu phẩy. KHÔNG ĐƯỢC bao gồm tên nghệ sĩ "${artist || ''}" trong chuỗi kết quả.
    5. Không giải thích gì thêm.
    
    Ví dụ: Modern V-Pop, 105 BPM, G Major, Clean Electric Guitar, Atmospheric Pads, Emotional Male Vocals, High-end Reverb.
        `;
    }
};
