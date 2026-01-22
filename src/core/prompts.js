/**
 * VSunoMaker - Prompt Templates
 * Centralized Prompt Engineering Logic
 */

export const Prompts = {
    /**
     * Generates the main composition prompt for Suno
     */
    composeMusic: (params) => {
        const { concept, vibe, artist, gender, region, isInstrumental, isCustomLyrics, customSystemPrompt, customStructure } = params;

        const artistContext = artist ? `\n    Đặc biệt, hãy nghiên cứu sâu và mô phỏng "ADN âm nhạc" của nghệ sĩ: "${artist}". 
        - Phong cách hát (Vocal Style): Cách luyến láy, ngân rung đặc trưng.` : "";

        const genderContext = gender && gender !== 'Random' ? `\n    - Giới tính giọng hát (Vocal Gender): BẮT BUỘC phải là "${gender}".` : "";
        const regionContext = region && region !== 'Standard' ? `\n  - Vùng miền (Region/Accent): Lời bài hát và phong cách hát phải mang âm hưởng "${region} Vietnam". Lời bài hát nên sử dụng một số từ ngữ địa phương đặc trưng của vùng này để tạo cảm giác chân thực.` : "";

        // --- PROMPT MODES ---
        let promptModeInstructions = "";

        let structureInstruction = "";
        if (customStructure && customStructure.length > 0) {
            structureInstruction = `
        ### YÊU CẦU CẤU TRÚC ĐẶC BIỆT (STRUCTURE):
        - Bạn BẮT BUỘC phải tuân theo cấu trúc bài hát sau đây theo đúng trình tự:
        [${customStructure}]
        - Hãy phân bổ nội dung lời bài hát sao cho phù hợp với từng phần của cấu trúc này.
            `;
        } else {
            structureInstruction = `
        - Cấu trúc chuyên nghiệp: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Chorus], [Bridge - Cao trào], [Outro].
            `;
        }

        if (isInstrumental) {
            promptModeInstructions = `
        ### CHẾ ĐỘ: INSTRUMENTAL (KHÔNG LỜI)
        - Người dùng muốn tạo một bản nhạc không lời dựa trên mô tả: "${concept}".
        - Yêu cầu: KHÔNG được tạo ra bất kỳ lời bài hát nào.
        - Trường "lyrics" trong JSON phải để trống hoặc ghi "[Instrumental]".
        - Tập trung tối đa vào phần "style" để diễn tả đúng không khí (Atmosphere) và nhạc cụ.
            `;
        } else if (isCustomLyrics) {
            promptModeInstructions = `
        ### CHẾ ĐỘ: TÙY CHỈNH LỜI (CUSTOM LYRICS)
        - Người dùng đã cung cấp sẵn lời bài hát:
        "${concept}"
        
        - Nhiệm vụ của bạn:
        1. Phân tích lời bài hát kết hợp với phong cách chủ đạo là: "${vibe}".${genderContext}${regionContext}
        2. Chọn ra "style" và "title" phù hợp nhất dựa trên các thông số trên.
        3. Giữ nguyên lời bài hát gốc trong trường "lyrics". Bạn có thể thêm các thẻ [Meta Tags] như [Verse], [Chorus] vào trước các đoạn nếu chưa có, nhưng KHÔNG được thay đổi nội dung lời.
            `;
        } else {
            // Default: Creating from Concept
            promptModeInstructions = `
        ### CHẾ ĐỘ: SÁNG TÁC TỪ CONCEPT
        - Nhiệm vụ của bạn là biến ý tưởng: "${concept}" 
        - Thành một tác phẩm âm nhạc đỉnh cao với phong cách chủ đạo là: "${vibe}".${genderContext}${regionContext}
        
        ### YÊU CẦU VỀ LYRICS (Lời bài hát):
        - Ngôn ngữ: Tiếng Việt (hoặc Anh nếu vibe yêu cầu).
        ${structureInstruction}
        - Kỹ thuật: Sử dụng ẩn dụ, hình ảnh so sánh độc đáo, vần điệu (Rhyme scheme) chặt chẽ giữa các câu.
        - Metatags: Thêm các thẻ lệnh Suno như [Drop], [Guitar Solo], [Build-up], [Big Finish] ở các vị trí hợp lý.
            `;
        }

        // System Prompt Override or Append
        let systemPersona = `Bạn là "The Music Architect" - Một nhà sản xuất âm nhạc và nhạc sĩ lừng danh thế giới.`;
        if (customSystemPrompt) {
            systemPersona = `
        ### VAI TRÒ CỦA BẠN (ĐƯỢC NGƯỜI DÙNG CHỈ ĐỊNH):
        ${customSystemPrompt}
        (Hãy hành động đúng với vai trò trên. Nếu xung đột với vai trò mặc định, hãy ưu tiên vai trò này).
            `;
        }

        return `
    ${systemPersona}
    ${artistContext}

    ${promptModeInstructions}

    ### YÊU CẦU VỀ STYLE (Hòa âm phối khí):
    Phải bao gồm các thẻ tag nhạc lý chuyên sâu bằng tiếng Anh để Suno AI hiểu được linh hồn bài hát. CẤU TRÚC BẮT BUỘC:
    - [Sub-genre], [BPM], [Key], [Main Instruments], [Vocal Character của ${artist || 'nghệ sĩ'}], [${gender || 'Vocal Gender'}], [Atmosphere], [Studio Effects].
    - Ví dụ: Modern V-Pop, 100 BPM, C# Minor, Catchy Synth Pluck, Breathiness, Rap-singing, High-end Reverb.

    ### ĐỊNH DẠNG ĐẦU RA (JSON DUY NHẤT):
    {
      "title": "Tên bài hát đầy tính nghệ thuật",
      "style": "Chuỗi tag style chuyên sâu",
      "lyrics": "Nội dung lời bài hát (hoặc [Instrumental])"
    }

    Hãy sáng tạo một kiệt tác có khả năng gây nghiện (Viral) và chạm đến cảm xúc người nghe.
        `;
    },

    /**
     * Polish Lyrics Prompt
     */
    polishLyrics: (lyrics) => {
        return `
    Bạn là một chuyên gia ngôn ngữ và nhạc sĩ tài ba (Lyrics Polisher).
    Nhiệm vụ: Chỉnh sửa lời bài hát sau để nó trở nên vần điệu (rhyme), trôi chảy (flow) và giàu chất thơ hơn, nhưng vẫn giữ nguyên ý nghĩa gốc.
    
    Lời gốc:
    """
    ${lyrics}
    """
    
    Yêu cầu:
    - Nếu là tiếng Việt: Sử dụng vần đơn, vần đôi, hoặc vần lưng. Đảm bảo số âm tiết cân đối.
    - Chỉ trả về duy nhất nội dung lời bài hát đã chỉnh sửa. Không giải thích thêm.
        `;
    },

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
        `;
    },

    /**
     * Analyze Audio Prompt
     */
    analyzeAudio: () => {
        return `Bạn là một chuyên gia phân tích âm nhạc và kỹ sư âm thanh lão luyện. 
        Tôi sẽ cung cấp cho bạn một đoạn âm thanh (MP3). Hãy lắng nghe thật kỹ và thực hiện các nhiệm vụ sau:
        
        1. Nhận diện Lời Bài Hát (Lyrics): Trích xuất chính xác lời bài hát nếu có. Nếu là nhạc không lời, hãy ghi [Instrumental].
        2. Phân tích Nhạc Điệu (Melody & Harmony): Xác định tông (Key), nhịp (Tempo/BPM), cấu trúc bài hát.
        3. Phân tích Nhạc Cụ (Instruments): Những nhạc cụ chính được sử dụng.
        4. Phân tích Giọng Hát (Vocal Characteristics): Đặc điểm giọng (Nam/Nữ, trầm/bổng, phong cách hát).
        5. Xác định Phong Cách (Style Tags): Bộ tag chi tiết để tái hiện lại không khí bài hát này trên Suno.
        
        Hãy trả về kết quả dưới định dạng JSON duy nhất như sau:
        {
          "lyrics": "Toàn bộ lời bài hát trích xuất được...",
          "style": "Chuỗi style tag chi tiết (Genre, BPM, Key, Instruments, Mood, Vocal Style)",
          "title": "Tên bài hát gốc (nếu biết) hoặc đặt tên mới phù hợp",
          "vibe": "Mô tả ngắn gọn cảm xúc của bài hát",
          "isInstrumental": true/false
        }
        
        Lưu ý: Bạn không được thêm bất kỳ lời giải thích nào bên ngoài JSON.`;
    }
};
