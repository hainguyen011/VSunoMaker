/**
 * VSunoMaker - Background Service Worker (Refactored)
 */

import { callGemini, callGeminiVision, callGeminiAudio, fetchModels } from '../core/ai-service.js';
import { Prompts } from '../features/prompts/index.js';
import { StorageService } from '../services/storage-service.js';
import './hot-reload.js';

// --- MESSAGE HANDLERS ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // 1. Compose Music
    if (request.action === "COMPOSE_WITH_AI") {
        handleComposition(request)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open
    }

    // 2. Polish Lyrics
    if (request.action === "POLISH_LYRICS") {
        const prompt = Prompts.polishLyrics(request.params);
        callGemini(prompt, request.apiKey, request.model)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 2.5. Regenerate Review Item
    if (request.action === "REGENERATE_REVIEW_ITEM") {
        const prompt = Prompts.regenerateReviewItem(request.params);
        callGemini(prompt, request.apiKey, request.model)
            .then(data => {
                const jsonMatch = data.match(/\{[\s\S]*?\}/);
                const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Parse error" };
                sendResponse({ success: true, data: result });
            })
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 3. Fuse Styles
    if (request.action === "FUSE_STYLES") {
        const prompt = Prompts.fuseStyles(request.styleA, request.styleB);
        callGemini(prompt, request.apiKey, request.model)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 4. Clone Vibe
    if (request.action === "CLONE_VIBE") {
        const prompt = Prompts.cloneVibe(request.source);
        callGemini(prompt, request.apiKey, request.model)
            .then(text => {
                // Try Parse JSON logic
                try {
                    const jsonMatch = text.match(/\{[\s\S]*?\}/);
                    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { style: text, artist: "" };
                    sendResponse({ success: true, data: result });
                } catch (e) {
                    sendResponse({ success: true, data: { style: text, artist: "" } });
                }
            })
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // AI Assistant Chat (Individual)
    if (request.action === "CHAT_WITH_ASSISTANT") {
        const { apiKey, model, userMessage, systemPrompt, musicContext, history, vibe, temperature, knowledgeBase } = request;

        // 1. Get Long-Term Memory
        chrome.storage.local.get(['long_term_memory'], (res) => {
            const longTermMemory = res.long_term_memory || [];
            const memoryContext = longTermMemory.length > 0
                ? `\n[KÝ ỨC DÀI HẠN (Những điều đã biết về người dùng)]:\n- ${longTermMemory.join('\n- ')}`
                : '';

            // Construct Premium Prompt with Vibe, Knowledge Base, and Memory
            const combinedPrompt = `
${systemPrompt}

${vibe ? `[HÀNH VI & CÁ TÍNH (VIBE)]: Hãy đóng vai một ${vibe.toUpperCase()}.` : ''}

${knowledgeBase ? `[CẨM NĂNG KIẾN THỨC / QUY TẮC CỐ ĐỊNH]:
${knowledgeBase}` : ''}
${memoryContext}

[DỮ LIỆU BẢN PHỐI HIỆN TẠI (CONTEXT)]:
${musicContext}

[CHỈ DẪN QUAN TRỌNG]: 
- GIAO TIẾP: Như bạn bè thân thiết. Ngắn gọn (dưới 2 câu nếu có thể).
- TUYỆT ĐỐI KHÔNG: Giới thiệu bản thân, nói mình là AI/Assistant, hay mô tả job của mình (trừ khi được hỏi).
- TUYỆT ĐỐI KHÔNG: Dùng văn mẫu, liệt kê context, hay nói sáo rỗng.
- LUÔN: Đi thẳng vào vấn đề, hoặc "tám" chuyện vui vẻ. Dùng từ ngữ đời thường (ngon, xịn, ảo ma, bác, tui...).
- Nếu người dùng chào, chỉ cần chào lại ngắn gọn + 1 câu hỏi thăm hoặc nhận xét siêu ngắn về nhạc đang làm.
- GHI NHỚ: Nếu có thông tin quan trọng về sở thích/thói quen của người dùng (tên, gu nhạc, ghét gì...), hãy tự động ghi nhớ bằng cú pháp cuối câu: [[MEMORY: nội dung cần nhớ]]. Ví dụ: [[MEMORY: Người dùng thích lofi chill]].
${userMessage}
            `.trim();

            // Pass temperature to the AI service
            callGemini(combinedPrompt, apiKey, model, history, parseFloat(temperature || 0.7))
                .then(async (data) => {
                    // 2. Process Memory Tags
                    let rawResponse = data;
                    const memoryRegex = /\[\[MEMORY:\s*(.*?)\]\]/g;
                    let match;
                    const newMemories = [];

                    while ((match = memoryRegex.exec(rawResponse)) !== null) {
                        newMemories.push(match[1].trim());
                    }

                    // Remove tags from user view
                    const cleanResponse = rawResponse.replace(memoryRegex, '').trim();

                    // Save new memories
                    if (newMemories.length > 0) {
                        const currentMem = (await chrome.storage.local.get(['long_term_memory'])).long_term_memory || [];
                        const updatedMem = [...new Set([...currentMem, ...newMemories])]; // Unique
                        await chrome.storage.local.set({ long_term_memory: updatedMem });
                        console.log("Saved new memories:", newMemories);
                    }

                    sendResponse({ success: true, data: cleanResponse });
                })
                .catch(err => sendResponse({ success: false, error: err.message }));
        });

        return true; // Keep channel open
    }

    // AI Council Chat (Group)
    if (request.action === "CHAT_WITH_COUNCIL") {
        const { apiKey, model, userMessage, council, musicContext, history } = request;

        // Construct Roundtable Prompt
        const membersInfo = council.members.map(m => `- **${m.name}**: ${m.prompt}`).join('\n');

        const roundtablePrompt = `
[HỆ THỐNG]: ĐÂY LÀ PHÒNG HỘI ĐỒNG (ROUNDTABLE). 
Bạn được giao nhiệm vụ mô phỏng một cuộc thảo luận giữa các chuyên gia AI sau đây:

${membersInfo}

[DỮ LIỆU BẢN PHỐI HIỆN TẠI (CONTEXT)]:
${musicContext}

[YÊU CẦU THẢO LUẬN]:
"${userMessage}"

[QUY TẮC PHÒNG HỌP]:
1. Hãy trình bày quan điểm của TẤT CẢ hoặc MỘT VÀI thành viên phù hợp nhất với câu hỏi.
2. Sử dụng định dạng: **[Tên Trợ Lý]**: [Nội dung phản hồi].
3. Các thành viên có thể đồng ý, phản biện hoặc bổ sung ý kiến cho nhau để giúp người dùng có kết quả tốt nhất.
4. Giữ phong cách chuyên nghiệp, sáng tạo và bám sát Context âm nhạc.
5. Luôn trả lời bằng tiếng Việt.
        `.trim();

        callGemini(roundtablePrompt, apiKey, model, history, 0.8) // High creativity for discussion
            .then(data => sendResponse({ success: true, data: data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // Fetch Available Models
    if (request.action === "FETCH_MODELS") {
        fetchModels(request.apiKey)
            .then(models => sendResponse({ success: true, data: models }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 5. Analyze Image (Multimodal)
    if (request.action === "ANALYZE_IMAGE") {
        callGeminiVision(request.imageBase64, request.apiKey, request.model)
            .then(text => {
                try {
                    const jsonMatch = text.match(/\{[\s\S]*?\}/);
                    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { description: text, vibe: "Cinematic" };
                    sendResponse({ success: true, data: result });
                } catch (e) {
                    sendResponse({ success: true, data: { description: text, vibe: "Cinematic" } });
                }
            })
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 5.5. Generate Styles (Pro)
    if (request.action === "GENERATE_STYLES") {
        const { lyrics, concept } = request.params;
        let prompt;

        // Use Deep Analysis if lyrics are provided for "Premium" result
        if (lyrics && lyrics.trim().length > 20) {
            prompt = Prompts.analyzeDeepStyle(request.params);
        } else {
            prompt = Prompts.generateStyles(request.params);
        }

        callGemini(prompt, request.apiKey, request.model)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 6. Analyze Audio (Multimodal)
    if (request.action === "ANALYZE_AUDIO") {
        callGeminiAudio(request.audioBase64, request.apiKey, request.model, request.params)
            .then(text => {
                try {
                    const jsonMatch = text.match(/\{[\s\S]*?\}/);
                    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { lyrics: "", style: text, title: "", vibe: "", isInstrumental: false, isSuggestedLyrics: false };
                    sendResponse({ success: true, data: result });
                } catch (e) {
                    sendResponse({ success: true, data: { lyrics: "", style: text, title: "", vibe: "", isInstrumental: false, isSuggestedLyrics: false } });
                }
            })
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 7. Open Side Panel
    if (request.action === "OPEN_SIDE_PANEL") {
        chrome.sidePanel.open({ windowId: sender.tab.windowId });
        sendResponse({ success: true });
        return true;
    }

    // 8. Analyze Artist DNA
    if (request.action === "ANALYZE_ARTIST_DNA") {
        const prompt = Prompts.analyzeArtistDNA(request.artist);
        callGemini(prompt, request.apiKey, request.model)
            .then(data => {
                console.log("[VSunoMaker] AI Raw Response:", data);
                try {
                    // Use new robust parsing utility
                    const result = parseAIJson(data);
                    sendResponse({ success: true, data: result });
                } catch (e) {
                    console.error("[VSunoMaker] Parse Error:", e);
                    console.error("[VSunoMaker] Failed JSON:", data);

                    // Show more helpful error with snippet
                    const snippet = data.substring(0, 300) + "...";
                    sendResponse({
                        success: false,
                        error: `Lỗi phân tích JSON: ${e.message}. Hãy thử lại hoặc chọn model khác. Debug: ${snippet}`
                    });
                }
            })
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 9. Track New Song (Dexie)
    if (request.action === "TRACK_NEW_SONG") {
        StorageService.addWork(request.data)
            .then(id => sendResponse({ success: true, id: id }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

});

// --- HELPER FUNCTIONS ---

function repairBadJson(jsonStr) {
    try {
        // 1. Remove Markdown code blocks
        let clean = jsonStr.replace(/```json\n?|```/g, '').trim();

        // 2. Remove excessive whitespace but preserve structure
        clean = clean.replace(/\n/g, ' ').replace(/\r/g, '').replace(/\s+/g, ' ');

        // 3. Fix missing commas between adjacent string values
        clean = clean.replace(/"\s+"/g, '", "');

        // 4. Try to fix common issues with quotes in Vietnamese text
        // Replace problematic patterns like ": "text, text, text" with safer separators
        // This is a heuristic approach - look for value strings with multiple commas

        return clean;
    } catch (e) {
        console.error('[repairBadJson] Error:', e);
        return jsonStr;
    }
}

// NEW: More robust JSON parsing with multiple fallback strategies
function parseAIJson(text) {
    // Strategy 1: Try direct parse
    try {
        return JSON.parse(text);
    } catch (e1) {
        console.warn('[parseAIJson] Direct parse failed, trying repair...');
    }

    // Strategy 2: Clean and try again
    try {
        const cleaned = repairBadJson(text);
        return JSON.parse(cleaned);
    } catch (e2) {
        console.warn('[parseAIJson] Repaired parse failed, trying extraction...');
    }

    // Strategy 3: Extract JSON from text
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const cleaned = repairBadJson(jsonMatch[0]);
            return JSON.parse(cleaned);
        }
    } catch (e3) {
        console.error('[parseAIJson] All strategies failed:', e3);
    }

    throw new Error('Could not parse JSON from AI response');
}

async function handleComposition(request) {
    if (!request.apiKey) throw new Error("Thiếu Gemini API Key.");

    // Generate Prompt using centralized logic
    const prompt = Prompts.composeMusic(request);

    // Call API
    const aiText = await callGemini(prompt, request.apiKey, request.model);

    // Parse JSON Result
    const jsonMatch = aiText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("AI không trả về đúng định dạng JSON.");

    return JSON.parse(jsonMatch[0]);
}



// --- CONTEXT MENU ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'openSidePanel',
        title: 'Open VSunoMaker Side Panel',
        contexts: ['all']
    });

    // Auto-re-inject content scripts to existing Suno tabs (Developer Experience)
    reInjectToSunoTabs();
});

async function reInjectToSunoTabs() {
    console.log('[VSunoMaker] Checking for existing Suno tabs for re-injection...');
    const tabs = await chrome.tabs.query({ url: "*://suno.com/*" });

    for (const tab of tabs) {
        try {
            console.log(`[VSunoMaker] Re-injecting to tab: ${tab.id}`);

            // Re-inject Styles using chrome.scripting (MV3)
            await chrome.scripting.insertCSS({
                target: { tabId: tab.id },
                files: ["src/content/suno-styles.css"]
            });

            // Re-inject Script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["src/content/suno-inject.js"]
            });

            console.log(`[VSunoMaker] Successfully re-injected to ${tab.id}`);
        } catch (err) {
            console.warn(`[VSunoMaker] Could not re-inject to tab ${tab.id}:`, err);
        }
    }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openSidePanel') {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});
