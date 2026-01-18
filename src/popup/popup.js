/**
 * Suno Hit-Maker AI - Popup Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- UI ELEMENTS ---
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- PREMIUM FEATURES (STUDIO) ---
    const magicPolishBtn = document.getElementById('magic-polish');
    const imageInput = document.getElementById('image-input');
    const imageUploadBox = document.getElementById('image-upload-box');
    const styleAInput = document.getElementById('style-a');
    const styleBInput = document.getElementById('style-b');
    const btnFuseStyle = document.getElementById('btn-fuse-style');
    const cloneInput = document.getElementById('clone-input');
    const btnCloneVibe = document.getElementById('btn-clone-vibe');

    // 1. Magic Polish (Lyrics)
    if (magicPolishBtn) {
        magicPolishBtn.addEventListener('click', () => {
            const lyrics = conceptInput.value.trim();
            const apiKey = apiKeyInput.value.trim();
            if (!lyrics || !apiKey) {
                updateLog("! Error: Cần nội dung lời và API Key.");
                return;
            }

            updateLog("> Magic Polisher: Đang phân tích vần điệu...");

            chrome.runtime.sendMessage({
                action: "POLISH_LYRICS",
                lyrics: lyrics,
                apiKey: apiKey
            }, (response) => {
                if (response && response.success) {
                    conceptInput.value = response.data;
                    updateLog("> Success: Lời bài hát đã được chuốt lại!");
                } else {
                    updateLog("! Error: " + (response.error || "Unknown"));
                }
            });
        });
    }

    // 2. See The Sound (Image Upload)
    imageUploadBox.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            updateLog("! Error: Cần API Key để phân tích ảnh.");
            return;
        }

        updateLog("> See The Sound: Đang tải và phân tích ảnh...");
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1]; // Remove data:image/type;base64,

            chrome.runtime.sendMessage({
                action: "ANALYZE_IMAGE",
                imageBase64: base64String,
                apiKey: apiKey
            }, (response) => {
                if (response && response.success) {
                    conceptInput.value = response.data.description;
                    selectedVibe = response.data.vibe;
                    customVibeInput.value = selectedVibe;

                    // Switch to concept mode if in lyrics mode
                    if (inputModeToggle.checked) {
                        inputModeToggle.checked = false;
                        // trigger change event manually or call update UI
                        inputModeToggle.dispatchEvent(new Event('change'));
                    }

                    updateLog("> Success: AI đã 'nghe' thấy âm thanh từ ảnh!");
                    updateLog(`> Vibe: ${selectedVibe}`);
                } else {
                    updateLog("! Error: " + (response.error || "Failed using Gemni Vision."));
                }
            });
        };
        reader.readAsDataURL(file);
    });

    // 3. Style Fusion
    btnFuseStyle.addEventListener('click', () => {
        const sA = styleAInput.value.trim();
        const sB = styleBInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        if (!sA || !sB || !apiKey) {
            updateLog("! Error: Nhập đủ 2 Style và API Key.");
            return;
        }

        updateLog("> Fusion Engine: Đang lai tạo DNA âm nhạc...");
        chrome.runtime.sendMessage({
            action: "FUSE_STYLES",
            styleA: sA,
            styleB: sB,
            apiKey: apiKey
        }, (res) => {
            if (res && res.success) {
                customVibeInput.value = res.data;
                selectedVibe = res.data;
                updateLog("> Success: Lai tạo hoàn tất!");
            } else {
                updateLog("! Error: " + res.error);
            }
        });
    });

    // 4. Clone The Vibe
    btnCloneVibe.addEventListener('click', () => {
        const sourceText = cloneInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        if (!sourceText || !apiKey) {
            updateLog("! Error: Nhập nguồn (lời/mô tả) và API Key.");
            return;
        }

        updateLog("> Cloner: Đang giải mã DNA bài hát gốc...");
        chrome.runtime.sendMessage({
            action: "CLONE_VIBE",
            source: sourceText,
            apiKey: apiKey
        }, (res) => {
            if (res && res.success) {
                customVibeInput.value = res.data.style;
                selectedVibe = res.data.style;
                artistInput.value = res.data.artist || "";
                // Update concept if user left it empty, or just notify
                if (!conceptInput.value.trim()) conceptInput.value = `Bài hát mang âm hưởng của: ${res.data.artist || 'Unknown'}`;

                updateLog("> Success: Đã sao chép Vibe thành công!");
            } else {
                updateLog("! Error: " + res.error);
            }
        });
    });



    // Compose Tab
    const conceptInput = document.getElementById('lyrics-input'); // This is the main text area
    const inputLabel = document.getElementById('input-label');
    const composeBtn = document.getElementById('compose-btn');
    const statusLog = document.getElementById('status-log');
    const customVibeInput = document.getElementById('custom-vibe-input');
    const vibeChips = document.querySelectorAll('.vibe-chip');

    // New Controls
    const inputModeToggle = document.getElementById('input-mode-toggle'); // Checked = Lyrics Mode
    const instrumentalMode = document.getElementById('instrumental-mode');
    const modeLabelConcept = document.getElementById('mode-concept');
    const modeLabelLyrics = document.getElementById('mode-lyrics');

    // Settings Tab
    const apiKeyInput = document.getElementById('api-key');
    const artistInput = document.getElementById('artist-input');
    const genderSelect = document.getElementById('vocal-gender');
    const regionSelect = document.getElementById('vocal-region');

    // History Tab
    const historyContainer = document.getElementById('history-container');

    let selectedVibe = "V-Pop Viral";

    // --- UI LOGIC ---
    function updateInputModeUI() {
        if (inputModeToggle.checked) {
            // Lyrics Mode
            modeLabelLyrics.classList.add('active');
            modeLabelConcept.classList.remove('active');
            inputLabel.innerText = "LỜI BÀI HÁT (LYRICS)";
            conceptInput.placeholder = "Nhập lời bài hát của bạn vào đây (Verse 1... Chorus...)...";
        } else {
            // Concept Mode
            modeLabelConcept.classList.add('active');
            modeLabelLyrics.classList.remove('active');
            inputLabel.innerText = "KỊCH BẢN (CONCEPT)";
            conceptInput.placeholder = "Ví dụ: Một bài tình ca buồn về mưa, giọng nữ trầm...";
        }
    }

    inputModeToggle.addEventListener('change', updateInputModeUI);

    instrumentalMode.addEventListener('change', () => {
        if (instrumentalMode.checked) {
            // Instrumental: Force Concept mode visually (though user can still type description)
            // Disable lyrics mode toggle? Or just use input as "Style Description"?
            // Let's keep it simple: Just visually dim lyrics-related things if needed.
            if (inputModeToggle.checked) {
                inputModeToggle.checked = false; // Switch back to 'Concept' as description
                updateInputModeUI();
            }
            inputLabel.innerText = "MÔ TẢ GIAI ĐIỆU (STYLE DESC)";
        } else {
            updateInputModeUI();
        }
    });


    // Advanced Tab
    const customSystemPromptInput = document.getElementById('custom-system-prompt');
    const structureDisplay = document.getElementById('structure-display');
    const structureBtns = document.querySelectorAll('.struct-btn:not(.clear-btn)');
    const clearStructureBtn = document.getElementById('clear-structure');

    let currentStructure = [];

    // --- ADVANCED TAB LOGIC ---
    // Structure Builder
    structureBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const part = btn.dataset.part;
            currentStructure.push(part);
            renderStructure();
            saveState();
        });
    });

    clearStructureBtn.addEventListener('click', () => {
        currentStructure = [];
        renderStructure();
        saveState();
    });

    function renderStructure() {
        structureDisplay.innerHTML = '';
        if (currentStructure.length === 0) {
            structureDisplay.innerHTML = '<span class="placeholder-text">Chưa chọn cấu trúc...</span>';
            return;
        }

        currentStructure.forEach((part, index) => {
            const tag = document.createElement('div');
            tag.className = 'structure-tag';
            tag.innerText = part;
            tag.title = "Click to remove";
            tag.addEventListener('click', () => {
                currentStructure.splice(index, 1);
                renderStructure();
                saveState();
            });
            structureDisplay.appendChild(tag);
        });
    }

    // --- TAB SWITCHING ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetId = `tab-${tab.dataset.tab}`;
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- STATE MANAGEMENT ---
    // Load state
    chrome.storage.local.get([
        'gemini_api_key', 'saved_concept', 'saved_artist', 'saved_vibe', 'saved_custom_vibe',
        'saved_gender', 'saved_region', 'prompt_history', 'saved_system_prompt', 'saved_structure'
    ], (res) => {
        if (res.gemini_api_key) apiKeyInput.value = res.gemini_api_key;
        if (res.saved_concept) conceptInput.value = res.saved_concept;
        if (res.saved_artist) artistInput.value = res.saved_artist;
        if (res.saved_gender) genderSelect.value = res.saved_gender;
        if (res.saved_region) regionSelect.value = res.saved_region;

        // Load Advanced Settings
        if (res.saved_system_prompt) customSystemPromptInput.value = res.saved_system_prompt;
        if (res.saved_structure) {
            currentStructure = res.saved_structure;
            renderStructure();
        }

        if (res.saved_custom_vibe) {
            customVibeInput.value = res.saved_custom_vibe;
            selectedVibe = res.saved_custom_vibe;
            vibeChips.forEach(c => c.classList.remove('active'));
        } else if (res.saved_vibe) {
            selectedVibe = res.saved_vibe;
            restoreVibeChip(selectedVibe);
        }

        renderHistory(res.prompt_history || []);
    });

    // Save state helper
    const saveState = () => {
        chrome.storage.local.set({
            gemini_api_key: apiKeyInput.value.trim(),
            saved_concept: conceptInput.value.trim(),
            saved_artist: artistInput.value.trim(),
            saved_vibe: selectedVibe,
            saved_custom_vibe: customVibeInput.value.trim(),
            saved_gender: genderSelect.value,
            saved_region: regionSelect.value,
            // Save Advanced Settings
            saved_system_prompt: customSystemPromptInput.value.trim(),
            saved_structure: currentStructure
        });
    };

    // Events for saving state
    [conceptInput, apiKeyInput, artistInput, customVibeInput, customSystemPromptInput].forEach(el => el.addEventListener('input', saveState));
    [genderSelect, regionSelect].forEach(el => el.addEventListener('change', saveState));



    // Vibe Selection
    vibeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            vibeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedVibe = chip.dataset.vibe;
            customVibeInput.value = "";
            saveState();
            updateLog(`> Vibe switched to: ${selectedVibe}`);
        });
    });

    customVibeInput.addEventListener('input', () => {
        if (customVibeInput.value.trim() !== "") {
            vibeChips.forEach(c => c.classList.remove('active'));
            selectedVibe = customVibeInput.value.trim();
        } else {
            selectedVibe = "V-Pop Viral"; // Fallback
            restoreVibeChip(selectedVibe);
        }
        saveState();
    });

    function restoreVibeChip(vibeName) {
        vibeChips.forEach(chip => {
            if (chip.dataset.vibe === vibeName) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }

    // --- HISTORY LOGIC ---
    function addToHistory(concept, vibe) {
        chrome.storage.local.get(['prompt_history'], (res) => {
            let history = res.prompt_history || [];
            const newItem = {
                id: Date.now(),
                concept: concept,
                vibe: vibe,
                timestamp: new Date().toLocaleString('vi-VN')
            };

            // Keep max 20 items
            history.unshift(newItem);
            if (history.length > 20) history.pop();

            chrome.storage.local.set({ prompt_history: history });
            renderHistory(history);
        });
    }

    function renderHistory(history) {
        historyContainer.innerHTML = '';
        if (!history || history.length === 0) {
            historyContainer.innerHTML = '<div class="empty-state">Chưa có lịch sử sáng tác.</div>';
            return;
        }

        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-concept">${item.concept}</div>
                <div class="history-meta">
                    <span>${item.vibe}</span>
                    <span>${item.timestamp.split(' ')[1]}</span> 
                </div>
            `;
            el.addEventListener('click', () => {
                // Restore logic
                conceptInput.value = item.concept;
                selectedVibe = item.vibe;
                customVibeInput.value = "";

                // Try to match chip or set custom
                let matched = false;
                vibeChips.forEach(chip => {
                    if (chip.dataset.vibe === item.vibe) {
                        chip.classList.add('active');
                        matched = true;
                    } else {
                        chip.classList.remove('active');
                    }
                });

                if (!matched) {
                    customVibeInput.value = item.vibe;
                }

                saveState();

                // Switch back to Compose tab
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                document.querySelector('[data-tab="compose"]').classList.add('active');
                document.getElementById('tab-compose').classList.add('active');

                updateLog(`> Restored history item.`);
            });
            historyContainer.appendChild(el);
        });
    }


    // --- INSPECTOR EVENTS ---
    document.getElementById('inspect-lyrics').addEventListener('click', () => startInspector('lyrics'));
    document.getElementById('inspect-style').addEventListener('click', () => startInspector('style'));

    async function startInspector(type) {
        updateLog(`> Studio: Đang soi vùng ${type.toUpperCase()}...`);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) chrome.tabs.sendMessage(tab.id, { action: "START_INSPECTOR", targetType: type });
        // Don't close popup in Side Panel mode
    }

    // --- COMPOSE LOGIC ---
    composeBtn.addEventListener('click', async () => {
        const inputText = conceptInput.value.trim();
        const artist = artistInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        const gender = genderSelect.value;
        const region = regionSelect.value;

        const isInstrumental = instrumentalMode.checked;
        const isCustomLyrics = inputModeToggle.checked;

        if (!inputText || !apiKey) {
            updateLog("! Error: Vui lòng nhập nội dung và API Key.");
            if (!apiKey) {
                document.querySelector('[data-tab="settings"]').click();
            }
            return;
        }

        updateLog("> Connecting to Gemini Deep Music AI...");
        composeBtn.disabled = true;
        composeBtn.innerText = "ĐANG SÁNG TÁC...";

        // Notify Content Script to Show Loading
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab && activeTab.url.includes("suno.com")) {
            chrome.tabs.sendMessage(activeTab.id, { action: "SHOW_LOADING" });
        }

        try {
            chrome.runtime.sendMessage({
                action: "COMPOSE_WITH_AI",
                concept: inputText, // This is either concept OR custom lyrics depending on mode
                vibe: selectedVibe,
                artist: artist,
                gender: gender,
                region: region,
                apiKey: apiKey,
                isInstrumental: isInstrumental,
                isCustomLyrics: isCustomLyrics,
                customSystemPrompt: customSystemPromptInput.value.trim(),
                customStructure: currentStructure.join(', ')
            }, async (aiResponse) => {
                if (!aiResponse || !aiResponse.success) {
                    updateLog("! AI Error: " + (aiResponse ? aiResponse.error : "Unknown"));
                    resetBtn();
                    return;
                }

                // Success
                addToHistory(inputText, selectedVibe);

                const masterpieceData = aiResponse.data;
                updateLog("> AI Composer: Kiệt tác đã sẵn sàng.");
                updateLog("> Injecting to Suno UI...");

                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

                if (!tab.url.includes("suno.com")) {
                    updateLog("! Error: Hãy mở Suno/create");
                    resetBtn();
                    return;
                }

                chrome.tabs.sendMessage(tab.id, {
                    action: "AUTO_FILL",
                    data: masterpieceData
                }, (injectResponse) => {
                    if (chrome.runtime.lastError) {
                        updateLog("! Lỗi: Hãy F5 (Refresh) trang Suno.");
                        console.error("Conn err:", chrome.runtime.lastError.message);
                    } else if (injectResponse && injectResponse.success) {
                        updateLog("> SUCCESS: Kiệt tác đã được điền!");
                    } else {
                        updateLog("! Failed: Hãy bật 'Custom Mode' trên Suno.");
                    }
                    resetBtn();
                });
            });

        } catch (error) {
            updateLog("! System Crash: " + error.message);
            // Hide Loading on Error
            if (activeTab && activeTab.url.includes("suno.com")) {
                chrome.tabs.sendMessage(activeTab.id, { action: "HIDE_LOADING" });
            }
            resetBtn();
        }
    });

    function updateLog(msg) {
        statusLog.innerText = msg;
    }

    function resetBtn() {
        composeBtn.disabled = false;
        composeBtn.innerText = "TẠO HIT NGAY";
    }
});
