/**
 * VSunoMaker - Background Service Worker (Refactored)
 */

import { callGemini, callGeminiVision, callGeminiAudio } from '../core/ai-service.js';
import { Prompts } from '../features/prompts/index.js';

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

    // AI Assistant Chat
    if (request.action === "CHAT_WITH_ASSISTANT") {
        const { apiKey, model, userMessage, systemPrompt, musicContext, history } = request;

        // Structure the prompt to clearly separate background context from the immediate conversation
        const combinedPrompt = `
${systemPrompt}

[DỮ LIỆU BẢN PHỐI HIỆN TẠI (CONTEXT)]:
${musicContext}

[CHỈ DẪN QUAN TRỌNG]: 
- Hãy sử dụng dữ liệu trên như tri thức nền để tư vấn. 
- Đừng lặp lại dữ liệu Context một cách máy móc trừ khi người dùng yêu cầu phân tích cụ thể.
- Hãy ưu tiên sự tự nhiên, trôi chảy và chuyên môn trong hội thoại.

[CÂU HỎI/YÊU CẦU CỦA NGƯỜI DÙNG]:
${userMessage}
        `.trim();

        callGemini(combinedPrompt, apiKey, model, history)
            .then(data => sendResponse({ success: true, data: data }))
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

});

// --- HELPER FUNCTIONS ---

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

async function deleteWork(workId) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['created_works'], (res) => {
            let works = res.created_works || [];
            works = works.filter(w => w.id !== workId);

            chrome.storage.local.set({ created_works: works }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    });
}

// --- CONTEXT MENU ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'openSidePanel',
        title: 'Open VSunoMaker Side Panel',
        contexts: ['all']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openSidePanel') {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});
