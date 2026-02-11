/**
 * Prompts Feature - Music Composition
 */

export const musicPrompts = {
    /**
     * Generates the main composition prompt for Suno
     */
    composeMusic: (params) => {
        const { concept, vibe, artist, gender, region, language, isInstrumental, isCustomLyrics, isCleanLyrics, customSystemPrompt, customStructure, musicFocus } = params;

        let focusContext = "";
        if (musicFocus === 'lyrics') {
            focusContext = `\n  - TRỌNG TÂM SÁNG TÁC: Tập trung tối đa vào phần LỜI (Lyrics). Hãy làm cho ca từ thực sự sâu sắc, sử dụng nhiều biện pháp tu từ, vần điệu (Rhyme) phức tạp và giàu hình ảnh cảm xúc.`;
        } else if (musicFocus === 'music') {
            focusContext = `\n  - TRỌNG TÂM SÁNG TÁC: Tập trung tối đa vào phần NHẠC (Style/Production). Hãy tạo ra một Style Tag chuyên sâu nhất có thể, chú trọng vào hòa âm, phối khí, hiệu ứng và nhạc cụ để Suno AI tạo ra bản phối đột phá.`;
        } else if (musicFocus === 'fusion') {
            focusContext = `\n  - TRỌNG TÂM SÁNG TÁC: Phối hợp linh hoạt (Fusion). Hãy tìm điểm giao thoa tốt nhất giữa lời và nhạc để cả hai nâng đỡ nhau hoàn hảo nhất.`;
        }

        const artistContext = artist ? `
    ### PHÂN TÍCH VÀ MÔ PHỎNG ADN NGHỆ SĨ (ARTIST SIMULATION):
    Người dùng muốn lấy cảm hứng từ (các) nghệ sĩ: "${artist}".
    Nhiệm vụ của bạn là "giải mã" và tái tạo các đặc trưng âm nhạc độc bản của họ mà không vi phạm bản quyền:
    - PHÂN RÃ CHẤT GIỌNG (VOCAL TIMBRE): Phân tích và mô phỏng độ dày, âm sắc (biến đổi từ khàn, ấm đến sáng, cao), energy level và "vibe" đặc trưng trong giọng hát.
    - KỸ THUẬT PHRASING & FLOW: Mô phỏng cách ngắt nhịp, luyến láy (vibrato), đổi tông (pitch slides), và cách nhả chữ đặc thù của từng người.
    - ĐA NGHỆ SĨ (COLLABORATION): Nếu có nhiều nghệ sĩ, hãy tạo ra một sự phối hợp (Fusion) logic: 
        * Ví dụ: Kết hợp sự gai góc trong Rap của nghệ sĩ A với sự mượt mà trong Vocal của nghệ sĩ B.
        * Phân bổ vai trò phù hợp trong cấu trúc bài hát (Verse 1 nghệ sĩ A, Chorus nghệ sĩ B, etc.).
    - QUY TẮC BẢO MẬT: Tuyệt đối KHÔNG nhắc tên "${artist}" trong bất kỳ kết quả JSON nào (Style, Title, Lyrics). Hãy chuyển hóa thành các mô tả kỹ thuật âm nhạc tương đương.` : "";

        const genderContext = (gender && gender !== 'Random')
            ? `\n    - Giới tính giọng hát (Vocal Gender): BẮT BUỘC phải là "${gender}".`
            : (artist ? `\n    - Giới tính giọng hát (Vocal Gender): VÌ NGƯỜI DÙNG CHỌN "NGẪU NHIÊN", hãy tự động xác định giới tính dựa trên (các) nghệ sĩ "${artist}" (Nam, Nữ, hoặc Song ca Nam-Nữ nếu có cả hai).` : "");

        let regionDetailedContext = "";
        if (language === 'Vietnamese' && region && region !== 'Standard') {
            if (region === 'Northern') {
                regionDetailedContext = `\n  - Vùng miền (Micro-dialect): Giọng miền Bắc (Hà Nội). Lời bài hát cần tinh tế, sử dụng các từ ngữ trang nhã, giàu hình ảnh truyền thống nhưng hiện đại. Cách ngắt nhịp rõ ràng, phát âm chuẩn các âm tiết.`;
            } else if (region === 'Central') {
                regionDetailedContext = `\n  - Vùng miền (Micro-dialect): Giọng miền Trung. Lời bài hát cần mộc mạc, chan chứa tình cảm. BẮT BUỘC sử dụng khéo léo một số từ địa phương (VD: mô, tê, răng, rứa) để tạo âm hưởng bản địa đặc trưng nhưng vẫn dễ nghe.`;
            } else if (region === 'Southern') {
                regionDetailedContext = `\n  - Vùng miền (Micro-dialect): Giọng miền Nam. Phong cách tự nhiên, phóng khoáng, trẻ trung. Sử dụng ngôn ngữ đời thường, gần gũi (VD: thiệt, hông, xíu). Nhịp điệu bản nhạc nên sôi động hoặc Bolero trữ tình đặc trưng.`;
            }
        } else if (region && region !== 'Standard') {
            regionDetailedContext = `\n  - Vùng miền (Region/Accent): "${region} accent/style".`;
        }

        const languageContext = language ? `\n  - Ngôn ngữ (Language): BẮT BUỘC phải sử dụng "${language}".` : "";

        // --- PROMPT MODES ---
        let promptModeInstructions = "";


        let structureInstruction = "";
        if (customStructure && (Array.isArray(customStructure) || typeof customStructure === 'string')) {
            // Parse structure format
            let structureList = "";

            if (Array.isArray(customStructure)) {
                structureList = customStructure.map(item => {
                    // item format: { id: "intro-ambient", category: "Intro" }
                    if (typeof item === 'object' && item.id) {
                        // Extract variant name from ID
                        const variantName = item.id.split('-').map(word =>
                            word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ');
                        return `[${variantName}]`;
                    } else {
                        // Fallback for old format (simple strings)
                        return `[${item}]`;
                    }
                }).join(', ');
            } else {
                // If it's already a string, just use it
                structureList = customStructure;
            }

            structureInstruction = `
        ### YÊU CẦU CẤU TRÚC ĐẶC BIỆT (STRUCTURE):
        - Bạn BẮT BUỘC phải tuân theo cấu trúc bài hát sau đây theo đúng trình tự:
        ${structureList}
        - Hãy phân bổ nội dung lời bài hát sao cho phù hợp với từng phần của cấu trúc này.
        - Chú ý đặc điểm của từng variant:
          * "Instrumental" = không có lời, chỉ nhạc cụ
          * "Spoken Word" = lời nói, không hát
          * "Dialogue" = đoạn hội thoại
          * "Ambient / FX" = âm thanh môi trường, hiệu ứng
          * "Vocal Chop" = vocal chops, cắt giọng
          * "Rap" = rap, nhịp nhanh
          * "Minimal" = tối giản, ít nhạc cụ
          * "Build-up" = tăng cường độ dần
          * "Hook-heavy" = tập trung vào hook
          * "Anthem / Wide" = hoành tráng, rộng
          * "Call & Response" = hỏi đáp
          * "Breakdown" = giảm năng lượng đột ngột
          * "Key / Mood change" = đổi tone hoặc mood
          * "Delayed" = trì hoãn, tạo tension
          * "Hard stop" = kết thúc đột ngột
          * "Fade out" = kết thúc fade out
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
        - Trường "lyrics" chỉ chứa:
          * Các thẻ cấu trúc: [Tên phần – Instrumental] hoặc [Tên phần – Mô tả nhạc cụ]
          * Vocal directions (nếu cần): (Instrumental only - English instruction)
        - Ví dụ:
          [Intro – Instrumental]
          (Instrumental only - gentle, atmospheric)
          [Verse 1 – Piano and strings]
          (Instrumental only - building tension)
          [Chorus – Full orchestra]
          [Outro – Instrumental fade out]
        - Tập trung tối đa vào phần "style" để diễn tả đúng không khí (Atmosphere) và nhạc cụ.
            `;
        } else if (isCustomLyrics) {
            promptModeInstructions = `
        ### CHẾ ĐỘ: TÙY CHỈNH LỜI (CUSTOM LYRICS)
        - Người dùng đã cung cấp sẵn lời bài hát:
        "${concept}"
        
        - Nhiệm vụ của bạn:
        1. Phân tích lời bài hát kết hợp với phong cách chủ đạo là: "${vibe}".${genderContext}${regionDetailedContext}${languageContext}
        2. Chọn ra "style" và "title" phù hợp nhất dựa trên các thông số trên.
        3. Giữ nguyên lời bài hát gốc trong trường "lyrics". Bạn có thể thêm các thẻ [Meta Tags] như [Verse], [Chorus] vào trước các đoạn nếu chưa có.
        4. QUAN TRỌNG - Xử lý dấu ngoặc đơn () và mô tả âm thanh:
           a) Nếu là mô tả âm thanh/SFX bằng tiếng Việt (VD: Tiếng gió lùa, tiếng trống chiêng), BẮT BUỘC dịch sang tiếng Anh và thêm tiền tố "Instrumental only -":
              - (Tiếng gió lùa...) → (Instrumental only - sound of wind blowing)
              - (Tiếng đàn tranh rải nhẹ) → (Instrumental only - gentle zither plucking)
           b) Nếu là mô tả nhạc cụ/cấu trúc (KHÔNG có "Instrumental only"), chuyển sang format []:
              - (Tiếng đàn tranh...) → [Intro – Đàn tranh and guitar]
              - (Piano solo) → [Interlude – Piano solo]
           c) Nếu đã có format đúng (Instrumental only - instruction), GIỮ NGUYÊN:
              - (Instrumental only - soft, melancholic) → GIỮ NGUYÊN
           d) Nếu thiếu tiền tố "Instrumental only" trong chỉ dẫn tiếng Anh, THÊM VÀO:
              - (soft piano) → (Instrumental only - soft piano)
        
        5. QUY TẮC PHỐI HỢP [STRUCTURE] VÀ (DIRECTION):
           - Nếu người dùng viết: "[Intro] (Ambient / FX)" kết hợp với mô tả bên dưới.
           - Hãy gộp lại thành: [Intro - Ambient / FX] sau đó xuống dòng và ghi chỉ dẫn (Instrumental only - ...).
            `;
        } else {
            // Default: Creating from Concept
            promptModeInstructions = `
        ### CHẾ ĐỘ: SÁNG TÁC TỪ CONCEPT
        - Nhiệm vụ của bạn là biến ý tưởng: "${concept}" 
        - Thành một tác phẩm âm nhạc đỉnh cao với phong cách chủ đạo là: "${vibe}".${genderContext}${regionDetailedContext}${languageContext}
        
        ### YÊU CẦU VỀ LYRICS (Lời bài hát):
        - Ngôn ngữ: ${language || 'Tiếng Việt'} (hoặc Anh nếu vibe yêu cầu).
        ${structureInstruction}
        - Kỹ thuật: Sử dụng ẩn dụ, hình ảnh so sánh độc đáo, vần điệu (Rhyme scheme) chặt chẽ giữa các câu.
        - Metatags: Thêm các thẻ lệnh Suno như [Drop], [Guitar Solo], [Build-up], [Big Finish] ở các vị trí hợp lý.
        
        ### ĐỊNH DẠNG CẤU TRÚC VÀ CHỈ DẪN:
        
        **1. CẤU TRÚC BÀI HÁT (Structure Tags - Dùng dấu ngoặc vuông []):**
        - Chỉ sử dụng dấu ngoặc vuông [] cho các thẻ cấu trúc phần bài hát
        - Với các phần không có lời, format: [Tên phần – Mô tả ngắn gọn]
        - Ví dụ đúng:
          * [Intro – Instrumental]
          * [Intro – Acoustic guitar and đàn tranh]
          * [Bridge – Music only]
          * [Outro – Instrumental fade out]
          * [Interlude – Piano solo]
        
        **2. CHỈ DẪN GIỌNG HÁT/NHẠC CỤ (Vocal Directions - Dùng dấu ngoặc đơn ()):**
        - BẮT BUỘC sử dụng format: (Instrumental only - English instruction)
        - Tiền tố "Instrumental only" LUÔN LUÔN phải có để AI không hát phần này
        - Chỉ dẫn phải bằng tiếng Anh, mô tả cách thể hiện/cảm xúc/nhạc cụ
        - Đặt trên một dòng riêng, TRƯỚC hoặc SAU câu hát liên quan
        - Ví dụ đúng:
          * (Instrumental only - soft, melancholic piano)
          * (Instrumental only - whispered, intimate)
          * (Instrumental only - powerful, soaring vocals)
          * (Instrumental only - gentle acoustic guitar strumming)
          * (Instrumental only - dramatic orchestral build-up)
          * (Instrumental only - sound of wind blowing through cliffs, dry leaves rustling, distant melancholic war horns and powerful war drums)
        
        
        **3. VÍ DỤ ÁP DỤNG ĐÚNG:**
        
        [Verse 1]
        Em nhớ anh trong đêm mưa rơi
        (Instrumental only - soft, melancholic)
        Từng giọt mưa như lòng ta chơi vơi
        
        [Chorus]
        (Instrumental only - powerful, emotional)
        Mãi yêu em dù đời có xa cách
        
        
        
        **4. VÍ DỤ SAI (TUYỆT ĐỐI KHÔNG DÙNG):**
        
        [Intro]
        (Tiếng đàn tranh rải nhẹ nhàng...)  ← SAI: Thiếu "Instrumental only"
        (Guitar acoustic)  ← SAI: Không có tiền tố
        
        
        **5. DẤU ĐẶC BIỆT CHO NHỊP ĐIỆU VÀ PHRASING:**
        
        Sử dụng các dấu đặc biệt để kiểm soát cách AI thể hiện lời bài hát:
        
        a) DẤU BA CHẤM (...) - Pause & Flow:
           - Tác dụng: Tạo khoảng lặng (pause), kéo dài nhịp, tạo cảm xúc lắng đọng, da diết.
           - Ví dụ: "Em yêu... anh mãi mãi"
                    "Nhớ anh... từng đêm dài..."
        
        b) DẤU GẠCH NGANG (-) - Quick Cut & Emphasis:
           - Tác dụng: Ngắt nhịp nhanh, đổi ý đột ngột hoặc nhấn mạnh vào chữ đứng ngay sau dấu gạch.
           - Ví dụ: "Anh đi rồi - em cô đơn"
                    "Yêu em - mãi không thay đổi"
        
        c) KẾT HỢP CẢ HAI:
           - Ví dụ: "Em nhớ... - nhớ anh quá"
        
        d) NGUYÊN TẮC SỬ DỤNG NGHIÊM NGẶT:
           - KHÔNG ĐƯỢC lạm dụng: Chỉ sử dụng tối đa 1-2 lần trong một đoạn (Verse/Chorus).
           - KHÔNG ĐƯỢC phá kết cấu: Phải đặt ở những vị trí ngắt nghỉ tự nhiên hoặc cao trào cảm xúc để không làm gãy mạch phrasing của bài hát.
           - Ưu tiên sự tinh tế: Sử dụng để tạo điểm nhấn đắt giá, tránh biến bài hát thành một chuỗi ngắt quãng rời rạc.
           - Dựa vào phong cách để thêm các dấu hiệu đặc biệt
        ${isCleanLyrics ? `
        **6. CHẾ ĐỘ LỜI NHẠC SẠCH (CLEAN LYRICS):**
        - BẮT BUỘC: KHÔNG ĐƯỢC sử dụng các dấu ba chấm (...) và dấu gạch ngang (-) trong lời bài hát.
        - Hãy giữ ca từ "Sạch" (Clean), chỉ bao gồm chữ cái và các dấu câu cơ bản (phẩy, chấm).
        - Tuyệt đối không thêm các ký hiệu điều hướng nhịp điệu vào giữa câu hoặc cuối câu.
        ` : ""}
        
        - Nếu có lời hát trong phần đó, chỉ cần ghi thẻ [Verse], [Chorus], etc. rồi xuống dòng và viết lời ngay.
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
    ${focusContext}

    ${promptModeInstructions}

    ### YÊU CẦU VỀ STYLE (Hòa âm phối khí):
    Phải bao gồm các thẻ tag nhạc lý chuyên sâu bằng tiếng Anh để Suno AI hiểu được linh hồn bài hát. CẤU TRÚC BẮT BUỘC:
    - [Sub-genre], [BPM], [Key], [Main Instruments], [Vocal Character], [Vocal Gender], [Atmosphere], [Studio Effects].
    
    ### YÊU CẦU SONIC ARCHITECT (KIẾN TRÚC ÂM THANH):
    - DÀN NHẠC (INSTRUMENTATION): ${params.instrumentation?.join(', ') || 'Auto-select instruments based on genre'}
    - KỸ THUẬT MIX (ENGINEERING): ${params.engineering?.join(', ') || 'Professional Studio Mix'}
    - BIỂU ĐỒ NĂNG LƯỢNG (ENERGY): ${params.energy?.join(', ') || 'Steady Energy Flow'}
    - AI phải tập trung sử dụng các nhạc cụ và kỹ thuật mix trên để xây dựng "Style Tag" một cách chuyên nghiệp nhất.

    ### ĐỒNG BỘ HÓA NHỊP ĐIỆU & CẢM XÚC (Premium Alignment):
    - Đảm bảo "style" được chọn phải phản ánh đúng năng lượng của "lyrics".
    - SỬ DỤNG HỆ THỐNG ĐIỀU HƯỚNG NHỊP ĐIỆU (RHYTHM PUNCTUATION) trong lời bài hát:
        * "," : Ngắt hơi ngắn (Micro-pause).
        * "..." : Ngân dài, tăng không gian (Sustain/Legato).
        * "." : Kết câu dứt khoát (Termination).
        * "!" : Nhấn mạnh cao trào (Accent).
    - Căn chỉnh lời theo phong cách nhịp điệu yêu cầu: "${params.rhythmFlow || 'Mặc định'}".
    - AI phải tự động điều chỉnh cách ngắt câu trong lyrics (phân bổ vào các thẻ [Verse], [Chorus]) để khớp với nhịp điệu dự kiến của style đã chọn.

    ### ĐỊNH DẠNG ĐẦU RA (JSON DUY NHẤT):
    {
      "title": "Tên bài hát đầy tính nghệ thuật",
      "style": "Chuỗi tag style chuyên sâu",
      "lyrics": "Nội dung lời bài hát (hoặc [Instrumental])"
    }

    ### QUAN TRỌNG - QUY TắC JSON:
    - Trả về DUY NHẤT một JSON object hợp lệ, không có text nào khác
    - Tất cả giá trị string phải được đặt trong dấu ngoặc kép
    - Các ký tự đặc biệt (…, —, newlines) CÓ THỂ sử dụng trực tiếp trong JSON
    - KHÔNG cần escape các ký tự … và — 
    - Sử dụng \\n cho xuống dòng trong lyrics
    - Đảm bảo không có dấu phẩy thừa ở cuối object hoặc array

    Hãy sáng tạo một kiệt tác có khả năng gây nghiện (Viral) và chạm đến cảm xúc người nghe.
        `;
    },

    /**
     * Analyze Artist DNA for Review (SIMPLIFIED VERSION)
     */
    analyzeArtistDNA: (artist) => {
        return `
    Phân tích ADN âm nhạc của: "${artist}"
    
    BƯỚC 1: Xác định số lượng nghệ sĩ
    - Nếu có DẤU PHẨY hoặc "và" → NHIỀU nghệ sĩ → set "is_collaboration": true
    - Nếu chỉ 1 tên → ĐƠN nghệ sĩ → set "is_collaboration": false
    
    BƯỚC 2: Trả về JSON theo cấu trúc phù hợp
    
    === CẤU TRÚC CHO NHIỀU NGHỆ SĨ (is_collaboration: true) ===
    {
      "is_collaboration": true,
      "artists": [
        {
          "name": "Tên nghệ sĩ 1",
          "vocal": {
            "gender": "Nam/Nữ/Song ca",
            "timbre": "Mô tả âm sắc (8-12 từ)",
            "traits": ["Tag1", "Tag2", "Tag3"],
            "techniques": ["Kỹ thuật đặc trưng 1", "Kỹ thuật 2"]
          },
          "lyrics": {
            "style": "Phong cách viết lời (10-15 từ)",
            "themes": ["Chủ đề 1", "Chủ đề 2"],
            "emotional_spectrum": ["Cảm xúc chủ đạo 1", "Cảm xúc 2"]
          },
          "musicality": {
            "genres": ["Genre1", "Genre2"],
            "instruments": ["Nhạc cụ 1", "Nhạc cụ 2"],
            "bpm_range": "VD: 100-120 BPM",
            "signature_sound": "Âm thanh dễ nhận biết (10-15 từ)"
          },
          "overall_vibe": "Tổng quan phong cách nghệ sĩ (15-20 từ)"
        },
        {
          "name": "Tên nghệ sĩ 2",
          "vocal": { /* cấu trúc giống trên */ },
          "lyrics": { /* cấu trúc giống trên */ },
          "musicality": { /* cấu trúc giống trên */ },
          "overall_vibe": "..."
        }
      ],
      "collaboration": {
        "fusion_style": "Mô tả phong cách kết hợp (15-20 từ)",
        "complementary_traits": [
          "Nghệ sĩ 1: Điểm mạnh - Nghệ sĩ 2: Điểm mạnh bổ sung",
          "Trait pair 2"
        ],
        "signature_tracks_vibe": "Vibe đặc trưng khi kết hợp (12-15 từ)",
        "recommended_roles": {
          "Tên nghệ sĩ 1": "Vai trò đề xuất (VD: Verse nhanh - Hook)",
          "Tên nghệ sĩ 2": "Vai trò đề xuất"
        }
      }
    }
    
    === CẤU TRÚC CHO ĐƠN NGHỆ SĨ (is_collaboration: false) ===
    {
      "is_collaboration": false,
      "vocal": {
        "gender": "Nam/Nữ/Song ca",
        "timbre": "Mô tả âm sắc (8-12 từ)",
        "traits": ["Tag1", "Tag2", "Tag3"],
        "techniques": ["Kỹ thuật đặc trưng 1", "Kỹ thuật 2"]
      },
      "lyrics": {
        "style": "Phong cách viết lời (10-15 từ)",
        "themes": ["Chủ đề 1", "Chủ đề 2"],
        "emotional_spectrum": ["Cảm xúc chủ đạo 1", "Cảm xúc 2"]
      },
      "musicality": {
        "genres": ["Genre1", "Genre2"],
        "instruments": ["Nhạc cụ 1", "Nhạc cụ 2"],
        "bpm_range": "VD: 110-130 BPM",
        "signature_sound": "Âm thanh dễ nhận biết (10-15 từ)"
      },
      "overall_vibe": "Tổng quan phong cách nghệ sĩ (15-20 từ)",
      "collaboration": null
    }

    QUY TẮC JSON NGHIÊM NGẶT:
    - CHỈ trả về JSON thuần túy - TUYỆT ĐỐI KHÔNG có markdown hoặc code block
    - TRONG TEXT FIELDS: SỬ DỤNG DẤU GẠCH NGANG (-) HOẶC TỪ NỐI (và/hoặc) THAY VÌ DẤU PHẨY
    - TUYỆT ĐỐI KHÔNG dùng dấu phẩy (,) trong nội dung text
    - Chỉ dùng dấu phẩy để phân cách các phần tử JSON
    - Nếu KHÔNG phải nhiều nghệ sĩ: collaboration = null
    - Dùng dấu nháy đơn nếu cần nhấn mạnh từ ngữ trong text
    
    VÍ DỤ TECHNIQUES: ["Rap nhanh", "Melisma", "Ad-libs", "Falset to", "Vibrato"]
    VÍ DỤ EMOTIONAL_SPECTRUM: ["Buồn và hoài niệm", "Vui vẻ năng động", "Sâu sắc trầm tư"]
    VÍ DỤ BPM_RANGE: "90-110 BPM" hoặc "120-140 BPM"
    VÍ DỤ SIGNATURE_SOUND: "Bass mạnh với synth overlay sáng" hoặc "Acoustic guitar nhẹ nhàng với string section"
        `;
    }
};

