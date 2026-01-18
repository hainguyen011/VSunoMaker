/**
 * VSunoMaker - Background Service Worker (Refactored)
 */

import { callGemini, callGeminiVision } from '../core/ai-service.js';
import { Prompts } from '../core/prompts.js';

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
        const prompt = Prompts.polishLyrics(request.lyrics);
        callGemini(prompt, request.apiKey)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 3. Fuse Styles
    if (request.action === "FUSE_STYLES") {
        const prompt = Prompts.fuseStyles(request.styleA, request.styleB);
        callGemini(prompt, request.apiKey)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    // 4. Clone Vibe
    if (request.action === "CLONE_VIBE") {
        const prompt = Prompts.cloneVibe(request.source);
        callGemini(prompt, request.apiKey)
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

    // 5. Analyze Image (Multimodal)
    if (request.action === "ANALYZE_IMAGE") {
        callGeminiVision(request.imageBase64, request.apiKey)
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

    // 6. Open Side Panel
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
    const aiText = await callGemini(prompt, request.apiKey);

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
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openSidePanel') {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});
