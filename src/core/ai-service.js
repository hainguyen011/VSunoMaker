/**
 * VSunoMaker - AI Service
 * Handles communication with Gemini API
 */

export async function callGemini(promptText, apiKey, model = "gemini-1.5-flash", history = [], temperature = 0.7) {
    // Note: Use 1.5-flash for best performance/cost
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Format chat history for Gemini API
    const contents = [];

    // Add history if present
    if (history && history.length > 0) {
        history.forEach(msg => {
            contents.push({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        });
    }

    // Add current prompt
    contents.push({
        role: 'user',
        parts: [{ text: promptText }]
    });

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: temperature
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `API Error: ${response.status}`);
        }

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("No candidates returned from AI.");
        }

        let text = data.candidates[0].content.parts[0].text.trim();
        // Global cleanup for markdown code blocks
        text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
        return text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

export async function callGeminiVision(base64Image, apiKey, model = "gemini-2.5-flash") {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [
                { text: "Hãy nhập vai một nhà soạn nhạc. Nhìn vào bức ảnh này, bạn nghe thấy âm thanh gì? Hãy mô tả một ý tưởng bài hát (Concept) và bộ Style Tag phù hợp với tâm trạng của bức ảnh. Trả về JSON: { \"description\": \"Mô tả ý tưởng bài hát...\", \"vibe\": \"Style Tag...\" }" },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
            ]
        }]
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Vision API Error");

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini Vision Error:", error);
        throw error;
    }
}

export async function callGeminiAudio(base64Audio, apiKey, model = "gemini-2.5-flash", context = {}) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const { language, artist, gender, region, musicFocus, customSystemPrompt, customStructure, vocalTraits, vocalPresets, emotions } = context;

    // Format structure for prompt
    let structureStr = "Cấu trúc chuẩn";
    if (customStructure && customStructure.length > 0) {
        structureStr = customStructure.map(s => s.id).join(', ');
    }

    const contextStr = `
    DỰ LIỆU ĐẶT HÀNG CỦA NGƯỜI DÙNG (USER PREFERENCES):
    - Ngôn ngữ: ${language || 'Tiếng Việt'}
    - Nghệ sĩ/ADN âm nhạc: ${artist || 'Tự do'}
    - Giới tính giọng hát: ${gender || 'Ngẫu nhiên'}
    - Vùng miền/Âm hưởng: ${region || 'Mặc định'}
    - Trọng tâm sáng tác: ${musicFocus || 'Cân bằng'}
    - Nhân cách AI yêu cầu: ${customSystemPrompt || 'Nhà sản xuất âm nhạc chuyên nghiệp'}
    - Cấu trúc bài hát mong muốn: ${structureStr}
    - Cảm xúc chủ đạo: ${emotions?.join(', ') || 'Tự nhiên'}
    - Đặc trưng giọng hát: ${vocalTraits?.join(', ') || 'Mặc định'}
    - Presets phòng thu: ${vocalPresets?.join(', ') || 'Studio'}
    `;

    const payload = {
        contents: [{
            parts: [
                {
                    text: `Bạn là một chuyên gia phân tích âm nhạc và "Âm nhạc Kiến trúc sư" (Music Architect).
    Nhiệm vụ: Lắng nghe đoạn âm thanh này, phân tích cấu trúc, giai điệu và tâm trạng để trích xuất thông tin hoặc sáng tác lời nhạc.

    ${contextStr}

    YÊU CẦU CHI TIẾT:
    1. KIỂM TRA LOẠI ÂM THANH: Xác định xem đây là nhạc có lời hay nhạc không lời (Beat/Instrumental).
    
    2. NẾU LÀ NHẠC CÓ LỜI (ORIGINAL SONG):
       - Trích xuất lời bài hát (lyrics), phong cách (style), và tiêu đề (title).
       - Đảm bảo "Detected Vibe" phản ánh đúng linh hồn của âm thanh.

    3. NẾU LÀ NHẠC KHÔNG LỜI (BEAT/INSTRUMENTAL):
       - Trích xuất phong cách (style) và tiêu đề (title).
       - QUAN TRỌNG NHẤT: SÁNG TÁC một bản LỜI BÀI HÁT (lyrics) dựa trên giai điệu này. 
       - Lời nhạc PHẢI:
         * Ăn khớp hoàn toàn với nhịp điệu (Rhythm) và mood của beat.
         * Tuân thủ "Nhân cách AI yêu cầu" (nếu có).
         * Áp dụng "Cảm xúc chủ đạo" và "Đặc trưng giọng hát" đã chọn.
         * Phân bổ lời nhạc theo đúng "Cấu trúc bài hát mong muốn" sử dụng các thẻ [Verse], [Chorus], v.v.
         * Ngôn ngữ phải là ${language || 'Tiếng Việt'}.

    TRẢ VỀ JSON DUY NHẤT:
    {
      "title": "Tiêu đề bài hát",
      "style": "Chuỗi style tags chi tiết (Chỉ tiếng Anh)",
      "lyrics": "Lời bài hát trích xuất HOẶC Lời bài hát do AI sáng tác cho Beat",
      "isInstrumental": boolean,
      "detectedVibe": "Mô tả ngắn gọn về không khí âm nhạc",
      "isSuggestedLyrics": boolean (true nếu AI sáng tác lời cho Beat, false nếu trích xuất lời gốc từ âm thanh)
    }`
                },
                { inline_data: { mime_type: "audio/mpeg", data: base64Audio } }
            ]
        }]
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Audio API Error");

        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini Audio Error:", error);
        throw error;
    }
}

export async function fetchModels(apiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "List Models API Error");

        // Filter for 'generateContent' supported models
        const models = data.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace('models/', '')); // return just the ID e.g. gemini-1.5-flash

        return models;
    } catch (error) {
        console.error("Gemini List Models Error:", error);
        throw error;
    }
}
