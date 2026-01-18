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
    btn.innerHTML = '⚡';

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
    } else if (request.action === "AUTO_FILL") {
        // Stop loading first
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
    }
});

function toggleLoadingState(isLoading) {
    const targets = [
        document.querySelector('.shm-custom-target-lyrics'),
        document.querySelector('.shm-custom-target-style')
    ];

    targets.forEach(el => {
        if (el && el.parentElement) {
            // Add loading class to highlight frame if possible, or the element itself?
            // The element itself is easier for now.
            if (isLoading) {
                el.classList.add('shm-loading');
            } else {
                el.classList.remove('shm-loading');
            }
        }
    });

    // Also toggle the highlight frames loading state?
    // Let's rely on CSS .shm-loading on the target element for now.
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
            const tagName = el.tagName.toLowerCase();
            const labelText = overlay.querySelector('.label-text');
            labelText.innerText = `${type.toUpperCase()} <${tagName}>`;

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
    console.log(`[Suno HM] Regenerating ${targetType}...`);

    chrome.storage.local.get(['gemini_api_key', 'saved_concept', 'saved_artist', 'saved_vibe', 'saved_gender', 'saved_region'], (res) => {
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
            apiKey: res.gemini_api_key
        }, (aiResponse) => {
            btn.classList.remove('spinning');

            if (aiResponse && aiResponse.success) {
                fillSunoForm(aiResponse.data);

                const notification = document.createElement('div');
                notification.className = 'shm-notification';
                notification.innerText = `[Suno HM] Đã tái tạo xong ${targetType.toUpperCase()}`;
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
            notification.innerText = `[Suno HM] Đã khóa mục tiêu: ${currentTargetType.toUpperCase()}`;
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
