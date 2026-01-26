/**
 * Suno Hit-Maker AI - Content Script (V3 - Deluxe Inspector)
 */

console.log("Suno Hit-Maker AI: Content script V3 Active.");

// Initialize Floating Button
function initFloatingButton() {
    if (document.querySelector('.shm-floating-toggle')) return;

    const btn = document.createElement('div');
    btn.className = 'shm-floating-toggle';
    btn.title = 'Open VSunoMaker AI';
    btn.innerHTML = 'V';

    btn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "OPEN_SIDE_PANEL" });
    });

    document.body.appendChild(btn);
}

// Check URL and inject button if on create page
function checkAndInject() {
    if (window.location.href.includes('/create')) {
        initFloatingButton();
    } else {
        const btn = document.querySelector('.shm-floating-toggle');
        if (btn) btn.remove();
    }
}

// Run on load and URL change
checkAndInject();
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        checkAndInject();
    }
}).observe(document, { subtree: true, childList: true });

let highlightOverlays = {
    lyrics: null,
    style: null
};

let isInspectorActive = false;
let currentTargetType = null;
let lastHoveredElement = null;
let syncLoopActive = false;

// Messages from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START_INSPECTOR") {
        startInspector(request.targetType);
        sendResponse({ success: true });
    } else if (request.action === "STOP_INSPECTOR") {
        stopInspector();
        sendResponse({ success: true });
    } else if (request.action === "CLEAR_TARGET") {
        stopInspector();
        const type = request.targetType;
        document.querySelectorAll(`.shm-custom-target-${type}`).forEach(el => {
            el.classList.remove(`shm-custom-target-${type}`);
        });
        chrome.storage.local.remove(`custom_selector_${type}`);
        syncHighlights();
        sendResponse({ success: true });
    } else if (request.action === "AUTO_FILL") {
        toggleLoadingState(false);
        fillSunoForm(request.data).then(success => {
            sendResponse({ success: success });
        });
        return true;
    } else if (request.action === "SHOW_LOADING") {
        toggleLoadingState(true);
        sendResponse({ success: true });
    } else if (request.action === "HIDE_LOADING") {
        toggleLoadingState(false);
        sendResponse({ success: true });
    } else if (request.action === "OPEN_ASSISTANT_CHAT") {
        if (!window.shmAssistantChat) {
            window.shmAssistantChat = new AssistantChatWindow();
        }
        window.shmAssistantChat.open(request.assistant, request.musicContext);
        sendResponse({ success: true });
    }
});

// --- ASSISTANT CHAT WINDOW CLASS ---
class AssistantChatWindow {
    constructor() {
        this.container = null;
        this.shadow = null;
        this.messages = [];
        this.activeAssistant = null;
        this.musicContext = "";
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.init();
    }

    async init() {
        if (document.getElementById('shm-assistant-root')) return;

        // Container Host: Minimal size, absolute positioning handled by dragging
        this.container = document.createElement('div');
        this.container.id = 'shm-assistant-root';
        this.container.style.cssText = `
            position: fixed !important;
            bottom: 24px !important;
            right: 24px !important;
            width: 340px !important;
            height: 500px !important;
            z-index: 2147483647 !important;
            display: none;
            overflow: visible !important;
        `;

        // Shadow Root
        this.shadow = this.container.attachShadow({ mode: 'open' });

        // Link CSS
        const cssUrl = chrome.runtime.getURL('src/content/suno-styles.css');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;

        // Wait for CSS to load before allowing display (optional but safer)
        link.onload = () => console.log("[VSunoMaker] Shadow CSS Loaded.");
        this.shadow.appendChild(link);

        const chatUI = document.createElement('div');
        chatUI.className = 'shm-chat-window';
        chatUI.id = 'shm-window';
        // IMPORTANT: Inside Shadow, we remove fixed position from the window itself
        // so it follows the container host's position exactly.
        chatUI.style.cssText = `
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            right: auto !important;
            bottom: auto !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
        `;

        chatUI.innerHTML = `
            <div class="shm-chat-header" id="shm-chat-handler">
                <div class="shm-chat-info">
                    <div class="shm-chat-avatar" id="shm-avatar">🤖</div>
                    <div class="shm-chat-title-group">
                        <div class="shm-chat-name" id="shm-name">AI Assistant</div>
                        <div class="shm-chat-status">Online</div>
                    </div>
                </div>
                <div class="shm-chat-actions">
                    <button class="shm-icon-btn" id="shm-minimize" title="Thu nhỏ">_</button>
                    <button class="shm-icon-btn" id="shm-close" title="Đóng">×</button>
                </div>
            </div>
            
            <div class="shm-chat-messages" id="shm-msgs"></div>

            <div class="shm-chat-input-area">
                <div class="shm-context-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 0 0 0-9-9m9 9H3m9 9a9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"></path></svg>
                    Context Synced
                </div>
                <div class="shm-input-container">
                    <textarea class="shm-chat-input" id="shm-input" placeholder="Hỏi trợ lý về bản phối này..." rows="1"></textarea>
                    <button class="shm-send-btn" id="shm-send">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        `;

        this.shadow.appendChild(chatUI);
        document.body.appendChild(this.container);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const win = this.shadow.getElementById('shm-window');
        const handler = this.shadow.getElementById('shm-chat-handler');
        const closeBtn = this.shadow.getElementById('shm-close');
        const minBtn = this.shadow.getElementById('shm-minimize');
        const sendBtn = this.shadow.getElementById('shm-send');
        const input = this.shadow.getElementById('shm-input');

        // Dragging (Drag the entire host container)
        handler.onmousedown = (e) => {
            this.isDragging = true;
            this.dragOffset.x = e.clientX - this.container.offsetLeft;
            this.dragOffset.y = e.clientY - this.container.offsetTop;
            this.container.style.transition = 'none';
        };

        document.onmousemove = (e) => {
            if (!this.isDragging) return;
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;

            this.container.style.left = x + 'px';
            this.container.style.top = y + 'px';
            this.container.style.bottom = 'auto';
            this.container.style.right = 'auto';
        };

        document.onmouseup = () => {
            this.isDragging = false;
            this.container.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), height 0.3s';
        };

        // Window Controls
        closeBtn.onclick = () => this.container.style.display = 'none';
        minBtn.onclick = () => win.classList.toggle('minimized');

        // Chat Input
        sendBtn.onclick = () => this.sendMessage();
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        };

        // Auto-resize input
        input.oninput = () => {
            input.style.height = 'auto';
            input.style.height = (input.scrollHeight) + 'px';
        };
    }

    open(assistant, context) {
        this.activeAssistant = assistant;
        this.musicContext = context;
        this.messages = assistant.messages || [];

        this.shadow.getElementById('shm-name').innerText = assistant.name;
        this.shadow.getElementById('shm-avatar').innerText = assistant.avatar || '🤖';

        this.container.style.display = 'block';
        this.renderMessages();

        // Trigger Greeting if new conversation
        if (this.messages.length === 0) {
            this.triggerGreeting();
        }
    }

    renderMessages() {
        const msgsEl = this.shadow.getElementById('shm-msgs');
        msgsEl.innerHTML = '';

        if (this.messages.length === 0) {
            msgsEl.innerHTML = `<div id="shm-empty-state" style="text-align: center; color: rgba(255,255,255,0.4); font-size: 0.75rem; margin-top: 20px; font-style: italic;">Đang khởi tạo hội thoại...</div>`;
            return;
        }

        this.messages.forEach(msg => {
            const el = document.createElement('div');
            el.className = `shm-msg ${msg.role === 'user' ? 'user' : 'ai'}`;
            // Convert newlines to <br> for simple formatting
            el.innerHTML = msg.content.replace(/\n/g, '<br>');
            msgsEl.appendChild(el);
        });

        msgsEl.scrollTop = msgsEl.scrollHeight;
    }

    async triggerGreeting() {
        const msgsEl = this.shadow.getElementById('shm-msgs');
        // Initial "AI is thinking" state for greeting
        const emptyStateEl = msgsEl.querySelector('#shm-empty-state');
        if (emptyStateEl) emptyStateEl.innerText = `${this.activeAssistant.name} đang xem qua bài nhạc của bạn...`;

        chrome.runtime.sendMessage({
            action: "CHAT_WITH_ASSISTANT",
            apiKey: this.activeAssistant.apiKey,
            model: this.activeAssistant.model || 'gemini-2.0-flash',
            systemPrompt: this.activeAssistant.prompt,
            musicContext: this.musicContext,
            userMessage: "[HÀNH ĐỘNG HỆ THỐNG]: Hãy chào người dùng một cách tự nhiên. Tôi thấy bạn đã nắm bắt được bối cảnh sáng tác hiện tại của tôi (trong biến context). Hãy tóm tắt ngắn gọn những gì bạn thấy và đưa ra một lời khen hoặc gợi ý cải thiện sơ bộ để chúng ta bắt đầu thảo luận nhé.",
            history: []
        }, (res) => {
            if (res && res.success) {
                const aiMsg = { role: 'ai', content: res.data };
                this.messages.push(aiMsg);
                this.renderMessages();
                this.syncToStorage();
            } else {
                if (emptyStateEl) emptyStateEl.innerText = "Không thể bắt đầu hội thoại. Hãy kiểm tra API Key.";
            }
        });
    }

    async sendMessage() {
        const input = this.shadow.getElementById('shm-input');
        const text = input.value.trim();
        if (!text || !this.activeAssistant) return;

        // Add user message
        const userMsg = { role: 'user', content: text };
        this.messages.push(userMsg);
        this.renderMessages();

        input.value = '';
        input.style.height = 'auto';

        chrome.runtime.sendMessage({
            action: "CHAT_WITH_ASSISTANT",
            apiKey: this.activeAssistant.apiKey,
            model: this.activeAssistant.model || 'gemini-2.0-flash',
            systemPrompt: this.activeAssistant.prompt,
            musicContext: this.musicContext,
            userMessage: text,
            history: this.messages.slice(0, -1)
        }, (res) => {
            if (res && res.success) {
                const aiMsg = { role: 'ai', content: res.data };
                this.messages.push(aiMsg);
                this.renderMessages();

                // Sync back to storage
                this.syncToStorage();
            }
        });
    }

    syncToStorage() {
        chrome.storage.local.get(['music_assistants'], (res) => {
            const assistants = res.music_assistants || [];
            const idx = assistants.findIndex(a => a.id === this.activeAssistant.id);
            if (idx !== -1) {
                assistants[idx].messages = this.messages;
                chrome.storage.local.set({ music_assistants: assistants });
            }
        });
    }
}

function toggleLoadingState(isLoading) {
    const targets = [
        document.querySelector('.shm-custom-target-lyrics'),
        document.querySelector('.shm-custom-target-style')
    ];

    targets.forEach(el => {
        if (el) {
            if (isLoading) el.classList.add('shm-loading');
            else el.classList.remove('shm-loading');
        }
    });

    // Apply to highlight frames too for visual impact
    for (const type in highlightOverlays) {
        const frame = highlightOverlays[type];
        if (frame) {
            if (isLoading) frame.classList.add('shm-loading');
            else frame.classList.remove('shm-loading');

            // Also spin the button inside if it exists
            const btn = frame.querySelector('.shm-regen-btn');
            if (btn) {
                if (isLoading) btn.classList.add('spinning');
                else btn.classList.remove('spinning');
            }
        }
    }
}

// Sync Highlighting (Always On Top)
function syncHighlights() {
    const targets = {
        lyrics: document.querySelector('.shm-custom-target-lyrics'),
        style: document.querySelector('.shm-custom-target-style')
    };

    let hasTargets = false;

    for (const [type, el] of Object.entries(targets)) {
        if (el) {
            hasTargets = true;
            let overlay = highlightOverlays[type];
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = `shm-highlight-frame ${type}-target`;
                overlay.innerHTML = `
                    <div class="shm-highlight-label">
                        <span class="label-text"></span>
                    </div>
                    <button class="shm-regen-btn" title="Tái tạo (Regenerate)">↻</button>
                `;
                document.body.appendChild(overlay);
                highlightOverlays[type] = overlay;

                // Handle Regenerate Click
                overlay.querySelector('.shm-regen-btn').addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRegenerate(type);
                }, { capture: true });
            }

            const rect = el.getBoundingClientRect();
            const labelText = overlay.querySelector('.label-text');
            labelText.innerText = `${type.toUpperCase()}`;

            // Coordinate tracking (Always on top)
            const padding = 4;
            overlay.style.top = `${rect.top + window.scrollY - padding}px`;
            overlay.style.left = `${rect.left + window.scrollX - padding}px`;
            overlay.style.width = `${rect.width + (padding * 2)}px`;
            overlay.style.height = `${rect.height + (padding * 2)}px`;
            overlay.style.display = 'flex';
        } else if (highlightOverlays[type]) {
            highlightOverlays[type].style.display = 'none';
        }
    }

    // Manage sync loop properly to avoid duplicates
    if (isInspectorActive || hasTargets) {
        syncLoopActive = true;
        requestAnimationFrame(syncHighlights);
    } else {
        syncLoopActive = false;
    }
}

async function handleRegenerate(targetType) {
    const overlay = highlightOverlays[targetType];
    const btn = overlay.querySelector('.shm-regen-btn');

    btn.classList.add('spinning');
    console.log(`[VSunoMaker] Regenerating ${targetType}...`);

    chrome.storage.local.get([
        'gemini_api_key', 'gemini_model', 'saved_concept', 'saved_artist', 'saved_vibe', 'saved_custom_vibe',
        'saved_gender', 'saved_region', 'saved_language', 'is_clean_lyrics', 'is_custom_lyrics',
        'saved_system_prompt', 'saved_structure', 'saved_music_focus', 'saved_rhythm_flow',
        'saved_instrumentation', 'saved_engineering', 'saved_energy', 'saved_vocal_traits',
        'saved_vocal_presets', 'saved_emotions', 'is_instrumental'
    ], (res) => {
        if (!res.gemini_api_key || !res.saved_concept) {
            alert("Vui lòng thiết lập API Key và Concept trong Popup trước khi tái tạo.");
            btn.classList.remove('spinning');
            return;
        }

        chrome.runtime.sendMessage({
            action: "COMPOSE_WITH_AI",
            concept: res.saved_concept,
            vibe: res.saved_vibe || "V-Pop Viral",
            artist: res.saved_artist || "",
            gender: res.saved_gender || "Random",
            region: res.saved_region || "Standard",
            language: res.saved_language || "Vietnamese",
            apiKey: res.gemini_api_key,
            model: res.gemini_model || "gemini-2.0-flash",
            isInstrumental: res.is_instrumental || false,
            isCustomLyrics: res.is_custom_lyrics || false,
            isCleanLyrics: res.is_clean_lyrics || false,
            customSystemPrompt: res.saved_system_prompt || "",
            customStructure: res.saved_structure || [],
            musicFocus: res.saved_music_focus || "balanced",
            rhythmFlow: res.saved_rhythm_flow || "default",
            instrumentation: res.saved_instrumentation || [],
            engineering: res.saved_engineering || [],
            energy: res.saved_energy || [],
            vocalTraits: res.saved_vocal_traits || [],
            vocalPresets: res.saved_vocal_presets || [],
            emotions: res.saved_emotions || []
        }, (aiResponse) => {
            btn.classList.remove('spinning');

            if (aiResponse && aiResponse.success) {
                fillSunoForm(aiResponse.data);

                const notification = document.createElement('div');
                notification.className = 'shm-notification';
                notification.innerText = `[VSunoMaker] Đã tái tạo xong ${targetType.toUpperCase()}`;
                document.body.appendChild(notification);
                setTimeout(() => notification.remove(), 2500);
            } else {
                alert("Lỗi tái tạo: " + (aiResponse ? aiResponse.error : "Không xác định"));
            }
        });
    });
}

// Initial check for existing targets
if (document.querySelector('[class*="shm-custom-target"]')) {
    syncHighlights();
}

function startInspector(type) {
    isInspectorActive = true;
    currentTargetType = type;
    document.body.style.cursor = 'crosshair';

    const statusToast = document.createElement('div');
    statusToast.id = 'shm-inspector-toast';
    statusToast.className = 'shm-notification';
    statusToast.innerText = `[Studio Mode] Hãy nhấp vào vùng nhập ${type === 'lyrics' ? 'LỜI BÀI HÁT' : 'THỂ LOẠI'} trên Suno.`;
    document.body.appendChild(statusToast);

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('click', handleInspectorClick, { capture: true });

    if (!syncLoopActive) {
        syncHighlights();
    }
}

function stopInspector() {
    isInspectorActive = false;
    document.body.style.cursor = 'default';
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('click', handleInspectorClick, { capture: true });

    if (lastHoveredElement) {
        lastHoveredElement.style.outline = '';
        lastHoveredElement.style.boxShadow = '';
    }

    const toast = document.getElementById('shm-inspector-toast');
    if (toast) toast.remove();
}

function handleMouseOver(e) {
    if (!isInspectorActive) return;

    if (lastHoveredElement) {
        lastHoveredElement.style.outline = '';
        lastHoveredElement.style.boxShadow = '';
    }

    const el = e.target;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        el.style.outline = '3px solid #fa5656';
        el.style.boxShadow = '0 0 15px rgba(250, 86, 86, 0.5)';
    } else {
        el.style.outline = '1px dashed #fa5656';
    }
    lastHoveredElement = el;
}

function handleInspectorClick(e) {
    if (!isInspectorActive) return;

    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    // Tìm input hoặc textarea chính xác
    const inputEl = (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') ? el : el.querySelector('textarea, input');

    if (inputEl) {
        // Xóa class cũ
        document.querySelectorAll(`.shm-custom-target-${currentTargetType}`).forEach(item => {
            item.classList.remove(`shm-custom-target-${currentTargetType}`);
        });

        inputEl.classList.add(`shm-custom-target-${currentTargetType}`);

        chrome.storage.local.set({ [`custom_selector_${currentTargetType}`]: true }, () => {
            const notification = document.createElement('div');
            notification.className = 'shm-notification';
            notification.innerText = `[VSunoMaker] Đã khóa mục tiêu: ${currentTargetType.toUpperCase()}`;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 2500);
            stopInspector();

            // Đảm bảo cập nhật highlight mới ngay lập tức
            if (!syncLoopActive) syncHighlights();
        });
    } else {
        alert("Không tìm thấy ô nhập liệu trong vùng này. Hãy thử lại!");
    }
}

async function fillSunoForm(data) {
    try {
        await new Promise(resolve => setTimeout(resolve, 300));
        let lyricsField = document.querySelector('.shm-custom-target-lyrics');
        let styleField = document.querySelector('.shm-custom-target-style');

        if (!lyricsField || !styleField) {
            const allInputs = Array.from(document.querySelectorAll('input, textarea'));
            allInputs.forEach(el => {
                const context = ((el.placeholder || '') + (el.name || '') + (el.getAttribute('aria-label') || '') + (el.id || '')).toLowerCase();
                if (!lyricsField && el.tagName === 'TEXTAREA' && (context.includes('lyrics') || context.includes('prompt'))) {
                    lyricsField = el;
                } else if (!styleField && el.tagName === 'INPUT' && (context.includes('style') || context.includes('genre'))) {
                    styleField = el;
                }
            });
        }

        const setReactValue = (element, value) => {
            if (!element || !value) return;
            try {
                const nativeSetter = Object.getOwnPropertyDescriptor(
                    window[element.tagName === 'TEXTAREA' ? 'HTMLTextAreaElement' : 'HTMLInputElement'].prototype,
                    "value"
                ).set;
                nativeSetter.call(element, value);
                element.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (e) {
                element.value = value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        if (lyricsField) setReactValue(lyricsField, data.lyrics);
        if (styleField) setReactValue(styleField, data.style);
        return true;
    } catch (error) {
        console.error("Suno Hit-Maker AI Error:", error);
        return false;
    }
}

// ============================================
// WORKS TRACKING SYSTEM (Phase 2)
// ============================================

let trackedSongIds = new Set();
let songTrackingObserver = null;
let lastTrackedTime = 0;
const TRACK_DEBOUNCE_MS = 2000; // Reduced from 3000 to 2000 for faster detection
let scanAttempts = 0;

/**
 * Initialize song tracking system
 * Monitors DOM for new song elements appearing after creation
 */
function initSongTracking() {
    console.log("[VSunoMaker] ========================================");
    console.log("[VSunoMaker] Initializing song tracking system...");
    console.log("[VSunoMaker] ========================================");

    // Load previously tracked IDs to avoid duplicates
    chrome.storage.local.get(['tracked_song_ids'], (res) => {
        if (res.tracked_song_ids) {
            trackedSongIds = new Set(res.tracked_song_ids);
            console.log(`[VSunoMaker] Loaded ${trackedSongIds.size} previously tracked song IDs`);
        }
    });

    // Start observing DOM for new songs
    startSongObserver();

    // Scan immediately on page load
    console.log("[VSunoMaker] Running initial scan...");
    setTimeout(() => scanForNewSongs(), 1000);

    // Scan again after 3 seconds (in case songs are still loading)
    setTimeout(() => {
        console.log("[VSunoMaker] Running delayed scan...");
        scanForNewSongs();
    }, 3000);

    // Scan again after 6 seconds
    setTimeout(() => {
        console.log("[VSunoMaker] Running final delayed scan...");
        scanForNewSongs();
    }, 6000);

    // Set up periodic rescans every 10 seconds to catch newly completed songs
    setInterval(() => {
        console.log("[VSunoMaker] Running periodic scan...");
        scanForNewSongs();
    }, 10000);
}

/**
 * Start MutationObserver to detect new song elements
 */
function startSongObserver() {
    if (songTrackingObserver) return; // Already running

    songTrackingObserver = new MutationObserver((mutations) => {
        // Debounce: Don't check too frequently
        const now = Date.now();
        if (now - lastTrackedTime < TRACK_DEBOUNCE_MS) return;

        // Check if any mutations added new nodes
        let hasNewNodes = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                hasNewNodes = true;
                break;
            }
        }

        if (hasNewNodes) {
            console.log("[VSunoMaker] DOM mutation detected, scanning for new songs...");
            scanForNewSongs();
        }
    });

    // Observe the entire document for changes
    songTrackingObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log("[VSunoMaker] Song observer started");
}

/**
 * Scan the page for new song elements
 * Tries multiple selectors to find song cards/items
 */
function scanForNewSongs() {
    scanAttempts++;
    console.log(`[VSunoMaker] ========================================`);
    console.log(`[VSunoMaker] Scan attempt #${scanAttempts}`);
    console.log(`[VSunoMaker] ========================================`);

    // Common patterns for song elements on music platforms
    const possibleSelectors = [
        '[class*="song"]',
        '[class*="track"]',
        '[class*="playlist-item"]',
        '[class*="music-card"]',
        '[data-testid*="song"]',
        '[data-testid*="track"]',
        'article',
        '[role="article"]',
        '[class*="card"]',
        '[class*="item"]'
    ];

    let foundSongs = [];
    let totalElements = 0;

    // Try each selector
    for (const selector of possibleSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            totalElements += elements.length;

            if (elements.length > 0) {
                console.log(`[VSunoMaker] Selector "${selector}" found ${elements.length} elements`);
            }

            elements.forEach(el => {
                const songData = extractSongData(el);
                if (songData && songData.id && !trackedSongIds.has(songData.id)) {
                    console.log(`[VSunoMaker] ✅ New song found with selector "${selector}":`, songData.title);
                    foundSongs.push(songData);
                }
            });

            // If we found songs with this selector, stop trying others
            if (foundSongs.length > 0) break;
        } catch (e) {
            console.error(`[VSunoMaker] Error with selector "${selector}":`, e);
        }
    }

    console.log(`[VSunoMaker] Scan results: ${totalElements} total elements checked, ${foundSongs.length} new songs found`);

    // Track new songs
    if (foundSongs.length > 0) {
        console.log(`[VSunoMaker] 🎵 Found ${foundSongs.length} new song(s) to track!`);
        foundSongs.forEach(song => trackNewSong(song));
    } else {
        console.log(`[VSunoMaker] No new songs found in this scan`);
    }

    console.log(`[VSunoMaker] Currently tracking ${trackedSongIds.size} songs total`);
}

/**
 * Extract song metadata from a DOM element
 * Returns null if element doesn't look like a song or if song is not complete
 */
function extractSongData(element) {
    try {
        // Check if this element is actually a song card
        // Suno typically uses specific classes or data attributes
        const isSongCard = element.classList.contains('song') ||
            element.classList.contains('track') ||
            element.querySelector('[class*="song"]') ||
            element.querySelector('[class*="track"]') ||
            element.hasAttribute('data-song-id') ||
            element.hasAttribute('data-track-id');

        if (!isSongCard) return null;

        // Check for loading/generating status indicators
        // Skip if song is still being generated
        const isGenerating = element.querySelector('[class*="loading"]') ||
            element.querySelector('[class*="generating"]') ||
            element.querySelector('[class*="processing"]') ||
            element.querySelector('[class*="pending"]') ||
            element.textContent.includes('Generating') ||
            element.textContent.includes('Processing') ||
            element.textContent.includes('Loading');

        if (isGenerating) {
            console.log('[VSunoMaker] Skipping song - still generating');
            return null;
        }

        // Try to find song ID from various attributes
        const id = element.id ||
            element.dataset.id ||
            element.dataset.songId ||
            element.dataset.trackId ||
            element.getAttribute('data-song-id') ||
            element.getAttribute('data-track-id') ||
            element.getAttribute('id');

        // If no ID found, try to extract from URL in links
        if (!id) {
            const linkEl = element.querySelector('a[href*="/song/"]');
            if (linkEl) {
                const match = linkEl.href.match(/\/song\/([^\/\?]+)/);
                if (match) {
                    const extractedId = match[1];
                    console.log('[VSunoMaker] Extracted ID from URL:', extractedId);
                }
            }
        }

        if (!id) {
            console.log('[VSunoMaker] No ID found for element');
            return null;
        }

        // Try to find title - Suno usually has title in specific elements
        const titleEl = element.querySelector('[class*="title"]') ||
            element.querySelector('[class*="name"]') ||
            element.querySelector('h1, h2, h3, h4, h5') ||
            element.querySelector('[data-testid*="title"]');

        let title = titleEl?.textContent?.trim() || '';

        // Clean up title (remove extra whitespace, newlines)
        title = title.replace(/\s+/g, ' ').trim();

        // If title is too short or generic, it might not be a real song
        if (!title || title.length < 2) {
            console.log('[VSunoMaker] Invalid title:', title);
            return null;
        }

        // Try to find thumbnail/image
        const imgEl = element.querySelector('img');
        const thumbnailUrl = imgEl?.src || imgEl?.dataset.src || imgEl?.getAttribute('src') || '';

        // Try to find link/URL
        const linkEl = element.querySelector('a[href*="/song/"]') ||
            element.querySelector('a[href]');
        let songUrl = linkEl?.href || '';

        // If no direct link, construct from ID
        if (!songUrl && id) {
            songUrl = `https://suno.com/song/${id}`;
        }

        // Try to find audio URL
        const audioEl = element.querySelector('audio source, audio');
        const audioUrl = audioEl?.src || audioEl?.dataset.src || '';

        // IMPORTANT: Check if song has a play button or audio player
        // This indicates the song is complete and playable
        const hasPlayButton = element.querySelector('[class*="play"]') ||
            element.querySelector('button[aria-label*="play"]') ||
            element.querySelector('[data-testid*="play"]') ||
            audioEl !== null;

        if (!hasPlayButton) {
            console.log('[VSunoMaker] No play button found - song may not be complete');
            // Don't return null immediately, but mark as potentially incomplete
        }

        // Additional validation: check for duration or time indicator
        const hasDuration = element.querySelector('[class*="duration"]') ||
            element.querySelector('[class*="time"]') ||
            element.textContent.match(/\d+:\d+/); // Matches time format like 2:30

        console.log('[VSunoMaker] Song data extracted:', {
            id,
            title: title.substring(0, 50),
            hasPlayButton,
            hasDuration: !!hasDuration,
            thumbnailUrl: !!thumbnailUrl,
            songUrl
        });

        return {
            id,
            title,
            thumbnailUrl,
            songUrl,
            audioUrl,
            timestamp: Date.now(),
            hasPlayButton,
            hasDuration: !!hasDuration
        };
    } catch (e) {
        console.error('[VSunoMaker] Error extracting song data:', e);
        return null;
    }
}

/**
 * Track a newly created song
 * Combines Suno metadata with VSunoMaker creation data
 */
function trackNewSong(sunoData) {
    lastTrackedTime = Date.now();

    // Get VSunoMaker creation data from storage
    chrome.storage.local.get([
        'saved_concept',
        'saved_artist',
        'saved_vibe',
        'saved_gender',
        'saved_region',
        'created_works'
    ], (res) => {
        // Create complete work object
        const work = {
            // Unique ID
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

            // Timestamps
            timestamp: Date.now(),
            createdAt: new Date().toISOString(),

            // VSunoMaker data
            concept: res.saved_concept || '',
            artist: res.saved_artist || '',
            vibe: res.saved_vibe || 'V-Pop Viral',
            gender: res.saved_gender || 'Random',
            region: res.saved_region || 'Standard',

            // Suno metadata
            sunoId: sunoData.id,
            sunoUrl: sunoData.songUrl,
            title: sunoData.title,
            thumbnailUrl: sunoData.thumbnailUrl,
            audioUrl: sunoData.audioUrl,

            // Status
            status: 'created'
        };

        // Add to works list
        let works = res.created_works || [];
        works.unshift(work); // Add to beginning

        // Keep max 50 items
        if (works.length > 50) {
            works = works.slice(0, 50);
        }

        // Mark this song as tracked
        trackedSongIds.add(sunoData.id);
        const trackedIdsArray = Array.from(trackedSongIds);

        // Save to storage
        chrome.storage.local.set({
            created_works: works,
            tracked_song_ids: trackedIdsArray
        }, () => {
            console.log(`[VSunoMaker] ✅ Tracked new song: ${sunoData.title}`);

            // Show notification
            showTrackingNotification(sunoData.title);
        });
    });
}

/**
 * Show notification when a song is tracked
 */
function showTrackingNotification(title) {
    const notification = document.createElement('div');
    notification.className = 'shm-notification shm-success';
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">✅</span>
            <div>
                <div style="font-weight: 600;">Đã lưu tác phẩm!</div>
                <div style="font-size: 0.85em; opacity: 0.8;">${title}</div>
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

// Initialize tracking when on Suno
if (window.location.href.includes('suno.com')) {
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSongTracking);
    } else {
        initSongTracking();
    }
}
