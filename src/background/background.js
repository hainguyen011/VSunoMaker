/**
 * Suno Hit-Maker AI - Background Service Worker
 * Tích hợp Gemini API để sáng tác nhạc thật
 */

// API Key sẽ được lấy từ storage (người dùng nhập vào popup)
let GEMINI_API_KEY = "";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "COMPOSE_WITH_AI") {
        composeMusic(request.concept, request.vibe, request.artist, request.gender, request.region, request.apiKey)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function composeMusic(concept, vibe, artist, gender, region, apiKey) {
    if (!apiKey) throw new Error("Thiếu Gemini API Key.");

    const artistContext = artist ? `\n    Đặc biệt, hãy nghiên cứu sâu và mô phỏng "ADN âm nhạc" của nghệ sĩ: "${artist}". 
    Phân tích:
    1. Tone giọng đặc trưng (Vocal Tone): Ví dụ như husky, breathy, high-pitched, power vocals, falsetto, hay cách luyến láy.
    2. Phong cách phối khí (Arrangement Signature): Các loại nhạc cụ họ thường dùng, cấu trúc hợp âm (jazz chords, pop progression), và không gian âm nhạc (atmospheric, dry, vintage).
    3. Cách viết lời (Lyrical Style): Chủ đề yêu thích, cách gieo vần đặc thù.` : "";

    const genderContext = gender && gender !== 'Random' ? `\n    - Giới tính giọng hát (Vocal Gender): BẮT BUỘC phải là "${gender}".` : "";
    const regionContext = region && region !== 'Standard' ? `\n    - Vùng miền (Region/Accent): Lời bài hát và phong cách hát phải mang âm hưởng "${region} Vietnam". Lời bài hát nên sử dụng một số từ ngữ địa phương đặc trưng của vùng này để tạo cảm giác chân thực.` : "";

    const prompt = `
    Bạn là "The Music Architect" - Một nhà sản xuất âm nhạc và nhạc sĩ lừng danh thế giới. 
    Nhiệm vụ của bạn là biến ý tưởng: "${concept}" 
    Thành một tác phẩm âm nhạc đỉnh cao với phong cách chủ đạo là: "${vibe}".${artistContext}${genderContext}${regionContext}

    ### YÊU CẦU VỀ STYLE (Hòa âm phối khí):
    Phải bao gồm các thẻ tag nhạc lý chuyên sâu bằng tiếng Anh để Suno AI hiểu được linh hồn bài hát. CẤU TRÚC BẮT BUỘC:
    - [Sub-genre], [BPM], [Key], [Main Instruments], [Vocal Character của ${artist || 'nghệ sĩ'}], [${gender || 'Vocal Gender'}], [Atmosphere], [Studio Effects].
    - Ví dụ nếu là Sơn Tùng M-TP: Modern V-Pop, 100 BPM, C# Minor, Catchy Synth Pluck, Breathiness, Rap-singing, High-end Reverb.
    - Ví dụ nếu là Mỹ Tâm: Pop Soul, 75 BPM, E Major, Grand Piano, Soulful Belting, Emotional Chest Voice, Warm Texture.

    ### YÊU CẦU VỀ LYRICS (Lời bài hát):
    - Ngôn ngữ: Tiếng Việt (hoặc Anh nếu vibe yêu cầu).
    - Cấu trúc chuyên nghiệp: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Chorus], [Bridge - Cao trào], [Outro].
    - Kỹ thuật: Sử dụng ẩn dụ, hình ảnh so sánh độc đáo, vần điệu (Rhyme scheme) chặt chẽ giữa các câu.
    - Metatags: Thêm các thẻ lệnh Suno như [Drop], [Guitar Solo], [Build-up], [Big Finish] ở các vị trí hợp lý.

    ### ĐỊNH DẠNG ĐẦU RA (JSON DUY NHẤT):
    {
      "title": "Tên bài hát đầy tính nghệ thuật",
      "style": "Chuỗi tag style chuyên sâu",
      "lyrics": "Lời bài hát có cấu trúc đầy đủ thẻ tag"
    }

    Hãy sáng tạo một kiệt tác có khả năng gây nghiện (Viral) và chạm đến cảm xúc người nghe.
  `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error.message);

    const aiText = result.candidates[0].content.parts[0].text;
    // Trích xuất JSON từ text (đôi khi AI trả về kèm markdown)
    const jsonMatch = aiText.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error("AI không trả về định dạng đúng.");

    return JSON.parse(jsonMatch[0]);
}
