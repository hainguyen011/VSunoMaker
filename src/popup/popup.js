/**
 * Suno Hit-Maker AI - Popup Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- UI ELEMENTS ---
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    let typingTimer = null;

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

            updateLog("Magic Polisher: Đang phân tích vần điệu...");

            chrome.runtime.sendMessage({
                action: "POLISH_LYRICS",
                lyrics: lyrics,
                apiKey: apiKey,
                model: modelSelect.value
            }, (response) => {
                if (response && response.success) {
                    // Clean markdown if AI returns it
                    let cleanedData = response.data.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
                    conceptInput.value = cleanedData;
                    updateLog("> Success: Lời bài hát đã được chuốt lại!");
                } else {
                    updateLog("Lỗi: " + (response.error || "Unknown"));
                }
            });
        });
    }

    // 2. See The Sound (Image Upload)
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const btnRemoveImage = document.getElementById('btn-remove-image');

    // NEW: Suggestion Box Elements
    const stsResultBox = document.getElementById('sts-result-box');
    const stsConceptText = document.getElementById('sts-concept-text');
    const stsVibeText = document.getElementById('sts-vibe-text');
    const btnApplySts = document.getElementById('btn-apply-sts');

    imageUploadBox.addEventListener('click', () => imageInput.click());

    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show Preview
        const readerPreview = new FileReader();
        readerPreview.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreviewContainer.style.display = 'flex';
            imageUploadBox.style.display = 'none';
        };
        readerPreview.readAsDataURL(file);

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            updateLog("Lỗi: Cần API Key để phân tích ảnh.");
            return;
        }

        updateLog("See The Sound: Đang tải và phân tích ảnh...");
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];

            chrome.runtime.sendMessage({
                action: "ANALYZE_IMAGE",
                imageBase64: base64String,
                apiKey: apiKey,
                model: modelSelect.value
            }, (response) => {
                if (response && response.success) {
                    // Show Suggestion Box instead of Auto-fill
                    stsConceptText.innerText = response.data.description;
                    stsVibeText.innerText = response.data.vibe;
                    stsResultBox.style.display = 'block';

                    // Store temp data
                    stsResultBox.dataset.concept = response.data.description;
                    stsResultBox.dataset.vibe = response.data.vibe;

                    updateLog("Success: Đã phân tích xong! Xem gợi ý bên dưới.");
                } else {
                    updateLog("Lỗi: " + (response.error || "Failed using Gemni Vision."));
                    // Reset if failed
                    btnRemoveImage.click();
                }
            });
        };
        reader.readAsDataURL(file);
    });

    if (btnRemoveImage) {
        btnRemoveImage.addEventListener('click', () => {
            imageInput.value = "";
            imagePreview.src = "";
            imagePreviewContainer.style.display = 'none';
            imageUploadBox.style.display = 'flex';
            // Hide Suggestion Box
            if (stsResultBox) stsResultBox.style.display = 'none';
            if (stsConceptText) stsConceptText.innerText = '...';
            if (stsVibeText) stsVibeText.innerText = '...';
        });
    }

    if (btnApplySts) {
        btnApplySts.addEventListener('click', () => {
            const concept = stsResultBox.dataset.concept;
            const vibe = stsResultBox.dataset.vibe;

            if (concept && vibe) {
                // Populate Inputs
                conceptInput.value = concept;
                customVibeInput.value = vibe;
                selectedVibe = vibe;

                // Switch to Concept Mode if needed
                if (inputModeToggle.checked) {
                    inputModeToggle.checked = false;
                    // Trigger change to update UI (segmented control, placeholders)
                    inputModeToggle.dispatchEvent(new Event('change'));
                }

                // Restore Vibe Chip UI
                restoreVibeChip(selectedVibe);

                // Save and Notify
                saveState();
                updateLog("Đã áp dụng ý tưởng từ ảnh!");

                // Scroll to Top to show Compose area
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

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
        btnFuseStyle.disabled = true;
        btnFuseStyle.innerText = "ĐANG LAI TẠO DNA...";

        chrome.runtime.sendMessage({
            action: "FUSE_STYLES",
            styleA: sA,
            styleB: sB,
            apiKey: apiKey,
            model: modelSelect.value
        }, (res) => {
            btnFuseStyle.disabled = false;
            btnFuseStyle.innerText = "LAI TẠO STYLE";

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
            updateLog("Lỗi: Nhập nguồn (lời/mô tả) và API Key.");
            return;
        }

        updateLog("Cloner: Đang giải mã DNA bài hát gốc...");
        btnCloneVibe.disabled = true;
        btnCloneVibe.innerText = "ĐANG GIẢI MÃ DNA...";

        chrome.runtime.sendMessage({
            action: "CLONE_VIBE",
            source: sourceText,
            apiKey: apiKey,
            model: modelSelect.value
        }, (res) => {
            btnCloneVibe.disabled = false;
            btnCloneVibe.innerText = "DỊCH NGƯỢC STYLE";

            if (res && res.success) {
                const decodedStyle = res.data.style;
                const decodedArtist = res.data.artist || "";

                // Show Result Box
                const resultBox = document.getElementById('clone-result-box');
                const resultText = document.getElementById('clone-result-text');
                resultText.innerText = decodedStyle + (decodedArtist ? ` (Artist: ${decodedArtist})` : "");
                resultBox.style.display = 'block';

                // Setup Buttons
                document.getElementById('btn-copy-clone').onclick = () => {
                    navigator.clipboard.writeText(decodedStyle);
                    updateLog("> Đã sao chép Style vào bộ nhớ tạm!");
                };

                document.getElementById('btn-apply-clone').onclick = () => {
                    customVibeInput.value = decodedStyle;
                    selectedVibe = decodedStyle;
                    if (decodedArtist) artistInput.value = decodedArtist;

                    // Match vibe chip or deactivate
                    let matched = false;
                    vibeChips.forEach(chip => {
                        if (chip.dataset.vibe === decodedStyle) {
                            chip.classList.add('active');
                            matched = true;
                        } else {
                            chip.classList.remove('active');
                        }
                    });
                    if (!matched) customVibeInput.dispatchEvent(new Event('input'));

                    saveState();
                    updateLog("Đã áp dụng Style vào phần sáng tác!");
                };

                updateLog("> Success: Đã giải mã DNA bài hát!");
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

    // New Controls (Refactored)
    const segBtnConcept = document.getElementById('seg-btn-concept');
    const segBtnLyrics = document.getElementById('seg-btn-lyrics');
    const segmentedControl = document.querySelector('.mode-segmented-control');
    const inputModeToggle = document.getElementById('input-mode-toggle'); // Checked = Lyrics Mode
    const instrumentalMode = document.getElementById('instrumental-mode');

    // Settings Tab
    const apiKeyInput = document.getElementById('api-key');
    const modelSelect = document.getElementById('gemini-model');
    const artistInput = document.getElementById('artist-input');
    const genderSelect = document.getElementById('vocal-gender');
    const regionSelect = document.getElementById('vocal-region');

    // History Tab
    const historyContainer = document.getElementById('history-container');

    let selectedVibe = "V-Pop Viral";

    // --- UI LOGIC ---
    function updateInputModeUI() {
        const isLyrics = inputModeToggle.checked;

        // Update Segmented Control
        if (isLyrics) {
            segBtnLyrics.classList.add('active');
            segBtnConcept.classList.remove('active');
            segmentedControl.dataset.active = "lyrics";
        } else {
            segBtnConcept.classList.add('active');
            segBtnLyrics.classList.remove('active');
            segmentedControl.dataset.active = "concept";
        }

        // Update Labels & Placeholders
        if (isLyrics) {
            inputLabel.innerText = "LỜI BÀI HÁT (LYRICS)";
            conceptInput.placeholder = "Nhập lời bài hát của bạn vào đây (Verse 1... Chorus...)...";
        } else {
            inputLabel.innerText = "KỊCH BẢN (CONCEPT)";
            conceptInput.placeholder = "Ví dụ: Một bài tình ca buồn về mưa, giọng nữ trầm...";
        }
    }

    segBtnConcept.addEventListener('click', () => {
        inputModeToggle.checked = false;
        updateInputModeUI();
        saveState();
    });

    segBtnLyrics.addEventListener('click', () => {
        inputModeToggle.checked = true;
        updateInputModeUI();
        saveState();
    });

    // Handle indirect changes (like from analyzed image)
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

    if (clearStructureBtn) {
        clearStructureBtn.addEventListener('click', () => {
            currentStructure = [];
            renderStructure();
            saveState();
        });
    }

    function renderStructure() {
        if (!structureDisplay) return;
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
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');

            // Synchronize Log with Tab switching
            const tabNames = {
                'compose': 'Sáng tác',
                'history': 'Lịch sử',
                'settings': 'Cài đặt',
                'studio': 'Studio'
            };
            updateLog(`Chế độ: ${tabNames[tab.dataset.tab] || tab.dataset.tab.toUpperCase()}`);
        });
    });

    // --- STATE MANAGEMENT ---
    // Load state
    chrome.storage.local.get([
        'gemini_api_key', 'gemini_model', 'saved_concept', 'saved_artist', 'saved_vibe', 'saved_custom_vibe',
        'saved_gender', 'saved_region', 'prompt_history', 'saved_system_prompt', 'saved_structure'
    ], (res) => {
        if (res.gemini_api_key) apiKeyInput.value = res.gemini_api_key;
        if (res.gemini_model) modelSelect.value = res.gemini_model;
        if (res.saved_concept) conceptInput.value = res.saved_concept;
        if (res.saved_artist) artistInput.value = res.saved_artist;
        if (res.saved_gender) genderSelect.value = res.saved_gender;
        if (res.saved_region) regionSelect.value = res.saved_region;

        // Load Advanced Settings
        if (res.saved_system_prompt && customSystemPromptInput) customSystemPromptInput.value = res.saved_system_prompt;
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

    // --- INITIALIZATION SEQUENCE ---
    const startupSequence = [
        "BOOTING VSUNOMAKER OS...",
        "INITIALIZING AI MODULES...",
        "SYSTEM CHECK: 100% OK",
        "Hệ thống đã sẵn sàng..."
    ];

    let seqIdx = 0;
    function runStartupSequence() {
        if (seqIdx < startupSequence.length) {
            updateLog(startupSequence[seqIdx]);
            seqIdx++;
            setTimeout(runStartupSequence, 1200);
        }
    }

    // Start sequence
    runStartupSequence();

    // Save state helper
    const saveState = () => {
        chrome.storage.local.set({
            gemini_api_key: apiKeyInput.value.trim(),
            gemini_model: modelSelect.value,
            saved_concept: conceptInput.value.trim(),
            saved_artist: artistInput.value.trim(),
            saved_vibe: selectedVibe,
            saved_custom_vibe: customVibeInput.value.trim(),
            saved_gender: genderSelect.value,
            saved_region: regionSelect.value,
            // Save Advanced Settings
            saved_system_prompt: customSystemPromptInput ? customSystemPromptInput.value.trim() : "",
            saved_structure: currentStructure
        });
    };

    // Events for saving state
    const inputsToSave = [conceptInput, apiKeyInput, artistInput, customVibeInput];
    if (customSystemPromptInput) inputsToSave.push(customSystemPromptInput);

    inputsToSave.forEach(el => {
        if (el) el.addEventListener('input', saveState);
    });

    [genderSelect, regionSelect, modelSelect].forEach(el => {
        if (el) el.addEventListener('change', saveState);
    });



    // Vibe Selection
    vibeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            vibeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedVibe = chip.dataset.vibe;
            customVibeInput.value = "";
            saveState();
            updateLog(`Vibe: ${selectedVibe}`);
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
        if (!historyContainer) return;
        historyContainer.innerHTML = '';
        if (!history || history.length === 0) {
            historyContainer.innerHTML = '<div class="empty-state">Chưa có lịch sử sáng tác.</div>';
            return;
        }

        history.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-concept">${item.concept}</div>
                <div class="history-meta">
                    <span>${item.vibe}</span>
                    <span>${item.timestamp.split(' ')[1]}</span> 
                </div>
                <button class="delete-history-btn" title="Xóa">×</button>
            `;

            // Toggle restore logic
            el.addEventListener('click', (e) => {
                // If clicked on delete button, do nothing here
                if (e.target.classList.contains('delete-history-btn')) return;

                conceptInput.value = item.concept;
                selectedVibe = item.vibe;
                customVibeInput.value = "";

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
                    customVibeInput.dispatchEvent(new Event('input'));
                }

                saveState();

                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                const composeTabBtn = document.querySelector('[data-tab="compose"]');
                if (composeTabBtn) composeTabBtn.classList.add('active');
                const composeTabContent = document.getElementById('tab-compose');
                if (composeTabContent) composeTabContent.classList.add('active');

                updateLog(`Khôi phục: Mục lịch sử...`);
            });

            // Delete single item logic
            const deleteBtn = el.querySelector('.delete-history-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                chrome.storage.local.get(['prompt_history'], (res) => {
                    let h = res.prompt_history || [];
                    h.splice(index, 1);
                    chrome.storage.local.set({ prompt_history: h }, () => {
                        renderHistory(h);
                        updateLog("Đã xóa 1 mục lịch sử.");
                    });
                });
            });

            historyContainer.appendChild(el);
        });
    }

    // Clear All History logic
    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            if (confirm("Bạn có tin chắc muốn xóa toàn bộ lịch sử không?")) {
                chrome.storage.local.set({ prompt_history: [] }, () => {
                    renderHistory([]);
                    updateLog("Đã dọn sạch lịch sử!");
                });
            }
        });
    }


    // --- INSPECTOR EVENTS ---
    const inspectLyricsBtn = document.getElementById('inspect-lyrics');
    const inspectStyleBtn = document.getElementById('inspect-style');

    if (inspectLyricsBtn) inspectLyricsBtn.addEventListener('click', () => toggleInspector('lyrics', inspectLyricsBtn));
    if (inspectStyleBtn) inspectStyleBtn.addEventListener('click', () => toggleInspector('style', inspectStyleBtn));

    let activeInspectorType = null;

    async function toggleInspector(type, btnElement) {
        // If clicking the current active button -> Turn OFF
        if (activeInspectorType === type) {
            updateLog(`Studio: Đã tắt chế độ soi.`);
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) chrome.tabs.sendMessage(tab.id, { action: "CLEAR_TARGET", targetType: type });

            // Visual Update
            btnElement.classList.remove('active');
            activeInspectorType = null;
        }
        // If clicking a different button -> Turn OFF old, Turn ON new
        else {
            if (activeInspectorType) {
                // Remove active class from previous button
                const prevBtn = activeInspectorType === 'lyrics' ? inspectLyricsBtn : inspectStyleBtn;
                if (prevBtn) prevBtn.classList.remove('active');
            }

            // Turn ON new
            activeInspectorType = type;
            btnElement.classList.add('active');
            startInspector(type);
        }
    }

    async function startInspector(type) {
        updateLog(`Studio: Đang soi vùng ${type.toUpperCase()}...`);
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
            updateLog("Lỗi: Vui lòng nhập nội dung và API Key.");
            if (!apiKey) {
                const settingsTabBtn = document.querySelector('[data-tab="settings"]');
                if (settingsTabBtn) settingsTabBtn.click();
            }
            return;
        }

        updateLog("Kết nối: Gemini Deep Music AI...");
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
                model: modelSelect.value,
                isInstrumental: isInstrumental,
                isCustomLyrics: isCustomLyrics,
                customSystemPrompt: customSystemPromptInput ? customSystemPromptInput.value.trim() : "",
                customStructure: currentStructure.join(', '),
                vocalTraits: Array.from(document.querySelectorAll('#vocal-traits .pro-chip.active')).map(c => c.dataset.val),
                vocalPresets: Array.from(document.querySelectorAll('#vocal-presets .pro-chip.active')).map(c => c.dataset.val),
                emotions: Array.from(document.querySelectorAll('#emotion-chips .pro-chip.active')).map(c => c.dataset.val)
            }, async (aiResponse) => {
                if (!aiResponse || !aiResponse.success) {
                    updateLog("! AI Error: " + (aiResponse ? aiResponse.error : "Unknown"));
                    resetBtn();
                    return;
                }

                // Success
                addToHistory(inputText, selectedVibe);

                const masterpieceData = aiResponse.data;
                updateLog("AI Composer: Kiệt tác đã sẵn sàng.");
                updateLog("Đang nạp vào giao diện Suno...");

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
                        updateLog("SUCCESS: Kiệt tác đã được điền!");
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
        if (!statusLog) return;

        // Clear previous timer
        if (typingTimer) clearInterval(typingTimer);

        statusLog.innerText = "";
        let i = 0;
        typingTimer = setInterval(() => {
            if (i < msg.length) {
                statusLog.innerText += msg.charAt(i);
                i++;
            } else {
                clearInterval(typingTimer);
            }
        }, 30); // Speed of typing
    }

    function resetBtn() {
        if (composeBtn) {
            composeBtn.disabled = false;
            composeBtn.innerText = "TẠO HIT NGAY";
        }
    }

    // --- PREMIUM ACCORDION SYSTEM ---
    document.querySelectorAll('.studio-accordion').forEach(accordion => {
        const header = accordion.querySelector('.accordion-header');
        if (header) {
            header.addEventListener('click', () => {
                const isExpanded = accordion.classList.contains('expanded');

                if (isExpanded) {
                    accordion.classList.remove('expanded');
                } else {
                    accordion.classList.add('expanded');
                }
            });
        }
    });

    // --- STUDIO SUB-TABS LOGIC ---
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subTabContents = document.querySelectorAll('.sub-tab-content');

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSubTab = btn.dataset.subtab;

            // Update UI buttons
            subTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update UI content
            subTabContents.forEach(content => {
                const contentId = content.id;
                if (contentId === `studio-${targetSubTab}-content`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });

            updateLog(`Studio: Chế độ ${targetSubTab === 'basic' ? 'Cơ bản' : 'Nâng cao'}`);
        });
    });

    // --- PRO FEATURES CHIPS LOGIC ---
    function setupMultiSelectChips(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const chips = container.querySelectorAll('.pro-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                saveState();
            });
        });
    }

    setupMultiSelectChips('vocal-traits');
    setupMultiSelectChips('vocal-presets');
    setupMultiSelectChips('emotion-chips');
});
