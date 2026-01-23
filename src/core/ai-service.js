/**
 * VSunoMaker - AI Service
 * Handles communication with Gemini API
 */

export async function callGemini(promptText, apiKey, model = "gemini-2.5-flash") {
    // Note: Use 2.5-flash for best performance/cost
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
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

export async function callGeminiAudio(base64Audio, apiKey, model = "gemini-2.5-flash") {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{
            parts: [
                { text: "Bạn là một chuyên gia phân tích âm nhạc. Hãy lắng nghe đoạn âm thanh này và trích xuất đặc điểm. Trả về JSON: { \"lyrics\": \"...\", \"style\": \"...\", \"title\": \"...\", \"vibe\": \"...\", \"isInstrumental\": boolean }" },
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
