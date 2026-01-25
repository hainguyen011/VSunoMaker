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
        stopInspector(); // Ensure inspector stops
        const type = request.targetType;
        document.querySelectorAll(`.shm-custom-target-${type}`).forEach(el => {
            el.classList.remove(`shm-custom-target-${type}`);
        });
        chrome.storage.local.remove(`custom_selector_${type}`);
        syncHighlights();

        const notification = document.createElement('div');
        notification.className = 'shm-notification';
        notification.innerText = `[VSunoMaker] Đã hủy bỏ vùng: ${type.toUpperCase()}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);

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
    console.log(`[VSunoMaker] Regenerating ${targetType}...`);

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
