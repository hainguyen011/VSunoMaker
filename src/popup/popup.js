import { updateLog, renderMarkdown, enableCustomResize } from '../shared/utils.js';
import { initMagicPolish } from '../features/magic-polish/index.js';
import { initSettings } from '../features/settings/index.js';
import { CustomSelect } from '../shared/ui-components/custom-select.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- UI ELEMENTS ---
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    let typingTimer = null;

    // Initialize Features
    // 1. Magic Polish
    const magicPolishFeature = initMagicPolish();
    // 2. Settings (Model Fetcher)
    initSettings();

    // --- PREMIUM FEATURES (STUDIO) ---
    const magicPolishBtn = document.getElementById('magic-polish');
    const imageInput = document.getElementById('image-input');
    const imageUploadBox = document.getElementById('image-upload-box');
    const styleAInput = document.getElementById('style-a');
    const styleBInput = document.getElementById('style-b');
    const btnFuseStyle = document.getElementById('btn-fuse-style');
    const cloneInput = document.getElementById('clone-input');
    const btnCloneVibe = document.getElementById('btn-clone-vibe');

    const languageSelect = document.getElementById('vocal-language');
    const regionContainer = document.getElementById('region-container');
    const autoStyleBtn = document.getElementById('auto-style-btn');
    const musicFocusSelect = document.getElementById('music-focus');
    const rhythmFlowSelect = document.getElementById('rhythm-flow');

    // 1. Magic Polish (Lyrics) - Migrated to src/features/magic-polish/

    // 2. See The Sound (Image Upload)
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const btnRemoveImage = document.getElementById('btn-remove-image');

    // NEW: Suggestion Box Elements
    const stsResultBox = document.getElementById('sts-result-box');
    const stsConceptText = document.getElementById('sts-concept-text');
    const stsVibeText = document.getElementById('sts-vibe-text');
    const btnApplySts = document.getElementById('btn-apply-sts');

    // Hear The Sound (Audio Upload) Elements
    const audioUploadBox = document.getElementById('audio-upload-box');
    const audioInput = document.getElementById('audio-input');
    const audioPreviewContainer = document.getElementById('audio-preview-container');
    const audioFileName = document.getElementById('audio-file-name');
    const btnRemoveAudio = document.getElementById('btn-remove-audio');
    const htsResultBox = document.getElementById('hts-result-box');
    const htsTitleText = document.getElementById('hts-title-text');
    const htsStyleText = document.getElementById('hts-style-text');
    const htsLyricsText = document.getElementById('hts-lyrics-text');
    const btnApplyHts = document.getElementById('btn-apply-hts');
    const btnSuggestLyricsHts = document.getElementById('btn-suggest-lyrics-hts');
    let lastAudioBase64 = null; // To allow re-suggestion without re-upload

    // --- AI ASSISTANTS ELEMENTS (LOBBY) ---
    const assistantsGrid = document.getElementById('assistants-grid');
    const btnAddAssistantPro = document.getElementById('btn-add-assistant-pro');

    // Assistant Editor Modal
    const assistantEditorModal = document.getElementById('assistant-editor-modal');
    const closeAssistantEditor = document.getElementById('close-assistant-editor');
    const editAssistantName = document.getElementById('edit-assistant-name');
    const editAssistantPrompt = document.getElementById('edit-assistant-prompt');
    const editAssistantKey = document.getElementById('edit-assistant-key');
    const editAssistantModel = document.getElementById('edit-assistant-model');
    const btnSaveAssistant = document.getElementById('btn-save-assistant');
    const btnDeleteAssistant = document.getElementById('btn-delete-assistant');

    let currentAssistants = [];
    let activeAssistantId = null;
    let editingAssistantId = null;

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

    // --- HEAR THE SOUND LOGIC ---
    if (audioUploadBox) {
        audioUploadBox.addEventListener('click', () => audioInput.click());
    }

    if (audioInput) {
        audioInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Show Preview (just filename)
            audioFileName.innerText = file.name;
            audioPreviewContainer.style.display = 'flex';
            audioUploadBox.style.display = 'none';

            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                updateLog("Lỗi: Cần API Key để phân tích âm thanh.");
                return;
            }

            updateLog("Hear The Sound: Đang tải và phân tích MP3...");
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result.split(',')[1];
                lastAudioBase64 = base64String; // Save for re-suggestion

                chrome.runtime.sendMessage({
                    action: "ANALYZE_AUDIO",
                    audioBase64: base64String,
                    apiKey: apiKey,
                    model: "gemini-2.5-flash", // Audio analysis works best on 1.5 flash/pro
                    params: {
                        language: languageSelect.value,
                        artist: artistInput.value.trim(),
                        gender: genderSelect.value,
                        region: regionSelect.value,
                        musicFocus: musicFocusSelect ? musicFocusSelect.value : "balanced",
                        customSystemPrompt: customSystemPromptInput ? customSystemPromptInput.value.trim() : "",
                        customStructure: currentStructure,
                        vocalTraits: Array.from(document.querySelectorAll('#vocal-traits .pro-chip.active')).map(c => c.dataset.val),
                        vocalPresets: Array.from(document.querySelectorAll('#vocal-presets .pro-chip.active')).map(c => c.dataset.val),
                        emotions: Array.from(document.querySelectorAll('#emotion-chips .pro-chip.active')).map(c => c.dataset.val)
                    }
                }, (response) => {
                    if (response && response.success) {
                        const data = response.data;
                        htsTitleText.innerText = data.title || "Unknown Title";
                        htsStyleText.innerText = data.style || "Unknown Style";

                        // Handle Suggested Lyrics Badge/Text
                        if (data.isSuggestedLyrics) {
                            htsLyricsText.innerHTML = `<span style="color: #ffcc00; font-weight: 800; display: block; margin-bottom: 4px;">[ SUGGESTED LYRICS FOR BEAT ]</span>` + data.lyrics;
                        } else {
                            htsLyricsText.innerText = data.lyrics || "[No lyrics detected]";
                        }

                        htsResultBox.style.display = 'block';

                        // Store temp data
                        htsResultBox.dataset.title = data.title;
                        htsResultBox.dataset.style = data.style;
                        htsResultBox.dataset.lyrics = data.lyrics;
                        htsResultBox.dataset.isInstrumental = data.isInstrumental;

                        updateLog("Success: Đã " + (data.isSuggestedLyrics ? "gợi ý lời bài hát từ Beat!" : "trích xuất đặc điểm âm nhạc!"));

                        // Scroll result into view
                        htsResultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        updateLog("Lỗi: " + (response.error || "Failed analyzing audio."));
                        btnRemoveAudio.click();
                    }
                });
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnSuggestLyricsHts) {
        btnSuggestLyricsHts.addEventListener('click', () => {
            const apiKey = apiKeyInput.value.trim();
            if (!lastAudioBase64 || !apiKey) {
                updateLog("Lỗi: Cần file âm thanh và API Key.");
                return;
            }

            updateLog("Studio: Đang sáng tác lời bài hát mới cho Beat...");
            btnSuggestLyricsHts.disabled = true;
            btnSuggestLyricsHts.innerText = "ĐANG VIẾT LỜI...";

            chrome.runtime.sendMessage({
                action: "ANALYZE_AUDIO",
                audioBase64: lastAudioBase64,
                apiKey: apiKey,
                model: "gemini-2.5-flash",
                params: {
                    language: languageSelect.value,
                    artist: artistInput.value.trim(),
                    gender: genderSelect.value,
                    region: regionSelect.value,
                    musicFocus: musicFocusSelect ? musicFocusSelect.value : "balanced",
                    customSystemPrompt: customSystemPromptInput ? customSystemPromptInput.value.trim() : "",
                    customStructure: currentStructure,
                    vocalTraits: Array.from(document.querySelectorAll('#vocal-traits .pro-chip.active')).map(c => c.dataset.val),
                    vocalPresets: Array.from(document.querySelectorAll('#vocal-presets .pro-chip.active')).map(c => c.dataset.val),
                    emotions: Array.from(document.querySelectorAll('#emotion-chips .pro-chip.active')).map(c => c.dataset.val)
                }
            }, (response) => {
                btnSuggestLyricsHts.disabled = false;
                btnSuggestLyricsHts.innerText = "VIẾT LỜI MỚI CHO BEAT";

                if (response && response.success) {
                    const data = response.data;
                    // Update UI
                    if (data.isSuggestedLyrics || (data.lyrics && data.lyrics.length > 0)) {
                        htsLyricsText.innerHTML = `<span style="color: #ffcc00; font-weight: 800; display: block; margin-bottom: 4px;">[ NEW SUGGESTED LYRICS ]</span>` + data.lyrics;
                        htsResultBox.dataset.lyrics = data.lyrics;
                        updateLog("Success: Đã sáng tác lời mới thành công!");
                    } else {
                        updateLog("Thông báo: AI không thể tạo lời nhạc mới cho đoạn này.");
                    }
                } else {
                    updateLog("Lỗi: " + (response.error || "Không thể sáng tác lời."));
                }
            });
        });
    }

    if (btnRemoveAudio) {
        btnRemoveAudio.addEventListener('click', () => {
            audioInput.value = "";
            audioPreviewContainer.style.display = 'none';
            audioUploadBox.style.display = 'flex';
            if (htsResultBox) htsResultBox.style.display = 'none';
        });
    }

    if (btnApplyHts) {
        btnApplyHts.addEventListener('click', () => {
            const title = htsResultBox.dataset.title;
            const style = htsResultBox.dataset.style;
            const lyrics = htsResultBox.dataset.lyrics;
            const isInstrumental = htsResultBox.dataset.isInstrumental === 'true';

            if (style) {
                // Populate Inputs
                customVibeInput.value = style;
                selectedVibe = style;

                // NEW LOGIC: If we have lyrics (either extracted or suggested for a beat), 
                // we want to use them to create a vocal version.
                if (lyrics && lyrics.trim().length > 0) {
                    instrumentalMode.checked = false;
                    conceptInput.value = lyrics;
                    inputModeToggle.checked = true; // Switch to Lyrics mode
                } else if (isInstrumental) {
                    instrumentalMode.checked = true;
                    conceptInput.value = "Instrumental music inspired by " + title;
                    inputModeToggle.checked = false;
                } else {
                    instrumentalMode.checked = false;
                    conceptInput.value = lyrics;
                    inputModeToggle.checked = true;
                }

                // Trigger UI updates
                inputModeToggle.dispatchEvent(new Event('change'));
                instrumentalMode.dispatchEvent(new Event('change'));

                // Restore Vibe Chip UI
                restoreVibeChip(""); // Clear standard chips

                // Save and Notify
                saveState();
                updateLog("Đã áp dụng đặc điểm từ file MP3!");

                // Scroll to Top
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

    // 5. Auto Generate Style
    if (autoStyleBtn) {
        autoStyleBtn.addEventListener('click', () => {
            const concept = conceptInput.value.trim();
            const language = languageSelect ? languageSelect.value : "Vietnamese";
            const artist = artistInput.value.trim();
            const gender = genderSelect.value;
            const region = regionSelect.value;
            const apiKey = apiKeyInput.value.trim();

            if (!concept || !apiKey) {
                updateLog("! Error: Cần Ý tưởng/Lời nhạc và API Key.");
                return;
            }

            updateLog("Studio Producer: Đang phân tích và tạo Style...");
            autoStyleBtn.disabled = true;
            autoStyleBtn.innerText = "ĐANG TẠO...";

            // Determine if we are in Lyrics mode to send lyrics for Deep Analysis
            const isLyricsMode = inputModeToggle.checked;
            const lyrics = isLyricsMode ? concept : "";

            chrome.runtime.sendMessage({
                action: "GENERATE_STYLES",
                apiKey: apiKey,
                model: modelSelect.value,
                params: {
                    concept: concept,
                    lyrics: lyrics, // Added for Deep Analysis
                    language: language,
                    artist: artist,
                    gender: gender,
                    region: region
                }
            }, (res) => {
                autoStyleBtn.disabled = false;
                autoStyleBtn.innerText = "AUTO";

                if (res && res.success) {
                    customVibeInput.value = res.data;
                    selectedVibe = res.data;
                    vibeChips.forEach(c => c.classList.remove('active'));
                    saveState();
                    updateLog("> Success: Style đã được tối ưu hóa!");
                } else {
                    updateLog("! Error: " + res.error);
                }
            });
        });
    }



    // Compose Tab
    const conceptInput = document.getElementById('lyrics-input'); // This is the main text area
    const inputLabel = document.getElementById('input-label');
    const composeBtn = document.getElementById('compose-btn');
    const statusLog = document.getElementById('status-log');
    const customVibeInput = document.getElementById('custom-vibe-input');
    const vibeChips = document.querySelectorAll('.vibe-chip');
    const lyricsResizer = document.getElementById('lyrics-resizer');

    // Enable Resizer
    if (lyricsResizer && conceptInput) {
        enableCustomResize(lyricsResizer, conceptInput);
    }

    // New Controls (Refactored)
    const segBtnConcept = document.getElementById('seg-btn-concept');
    const segBtnLyrics = document.getElementById('seg-btn-lyrics');
    const segmentedControl = document.querySelector('.mode-segmented-control');
    const inputModeToggle = document.getElementById('input-mode-toggle'); // Checked = Lyrics Mode
    const instrumentalMode = document.getElementById('instrumental-mode');
    const cleanLyricsMode = document.getElementById('clean-lyrics-mode');
    const previewLyricsBtn = document.getElementById('preview-lyrics');
    const lyricsRenderPreview = document.getElementById('lyrics-render-preview');

    // Work Modal
    const workModal = document.getElementById('work-modal');
    const closeWorkModalBtn = document.getElementById('close-work-modal');
    const workModalConcept = document.getElementById('work-modal-concept');
    const workModalLyrics = document.getElementById('work-modal-lyrics');
    const workModalMeta = document.getElementById('work-modal-meta');
    const workModalReuseBtn = document.getElementById('work-modal-reuse');
    let currentWorkForModal = null;

    // Settings Tab
    const apiKeyInput = document.getElementById('api-key');
    const modelSelect = document.getElementById('gemini-model');
    const artistInput = document.getElementById('artist-input');
    const genderSelect = document.getElementById('vocal-gender');
    const regionSelect = document.getElementById('vocal-region');
    const languageSelectElement = document.getElementById('vocal-language'); // Local reference if needed
    const regionContainerElement = document.getElementById('region-container');

    // --- INITIALIZE CUSTOM SELECTS ---
    document.querySelectorAll('select').forEach(el => {
        new CustomSelect(el);
    });

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

    rhythmFlowSelect.addEventListener('change', () => {
        if (rhythmFlowSelect.value !== 'default' && cleanLyricsMode.checked) {
            cleanLyricsMode.checked = false;
            updateLog("Studio: Đã tắt 'Clean Ly' để cho phép sử dụng dấu câu điều hướng nhịp điệu.");
        }
        saveState();
    });

    // --- PREVIEW LOGIC ---
    if (previewLyricsBtn) {
        previewLyricsBtn.addEventListener('click', () => {
            const isPreviewing = previewLyricsBtn.classList.toggle('active');

            if (isPreviewing) {
                // Swith to Preview
                const lyrics = conceptInput.value;
                lyricsRenderPreview.innerHTML = renderMarkdown(lyrics);
                conceptInput.style.display = 'none';
                lyricsRenderPreview.style.display = 'block';
                previewLyricsBtn.innerHTML = 'Thoát';
                updateLog("Chế độ xem trước: Vần điệu đã được render.");
            } else {
                // Switch back to Edit
                conceptInput.style.display = 'block';
                lyricsRenderPreview.style.display = 'none';
                previewLyricsBtn.innerHTML = 'Xem trước';
                updateLog("Về chế độ soạn thảo.");
            }
        });
    }

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
    const clearStructureBtn = document.getElementById('clear-structure');

    let currentStructure = [];

    // ==================== PROFESSIONAL HIERARCHICAL STRUCTURE SYSTEM ====================

    // Structure Categories with 40+ Variants
    const STRUCTURE_CATEGORIES = {
        "Intro": {
            icon: "",
            color: "#3b82f6",
            variants: [
                { id: "intro", name: "Intro", description: "Phần mở đầu chuẩn, tạo không khí cho bài hát", duration: "4-8 bars" },
                { id: "intro-instrumental", name: "Intro (Instrumental)", description: "Mở đầu không lời, chỉ nhạc cụ", duration: "4-8 bars" },
                { id: "intro-spoken", name: "Intro (Spoken Word)", description: "Mở đầu bằng lời nói", duration: "4-8 bars" },
                { id: "intro-dialogue", name: "Intro (Dialogue)", description: "Mở đầu bằng đoạn hội thoại", duration: "4-8 bars" },
                { id: "intro-ambient", name: "Intro (Ambient / FX)", description: "Mở đầu với âm thanh môi trường/hiệu ứng", duration: "4-8 bars" },
                { id: "intro-vocal-chop", name: "Intro (Vocal Chop)", description: "Mở đầu với vocal chops", duration: "4-8 bars" }
            ]
        },
        "Verse": {
            icon: "",
            color: "#8b5cf6",
            variants: [
                { id: "verse", name: "Verse", description: "Phần kể chuyện chuẩn, phát triển nội dung", duration: "8-16 bars" },
                { id: "verse-narrative", name: "Verse (Narrative / Storytelling)", description: "Verse tập trung kể chuyện chi tiết", duration: "8-16 bars" },
                { id: "verse-rap", name: "Verse (Rap)", description: "Verse dạng rap, nhịp nhanh", duration: "8-16 bars" },
                { id: "verse-half-sung", name: "Verse (Half-sung / Talk-sung)", description: "Verse nửa hát nửa nói", duration: "8-16 bars" },
                { id: "verse-minimal", name: "Verse (Minimal)", description: "Verse tối giản, ít nhạc cụ", duration: "8-16 bars" }
            ]
        },
        "Pre-Chorus": {
            icon: "",
            color: "#ec4899",
            variants: [
                { id: "pre-chorus", name: "Pre-Chorus", description: "Phần chuẩn bị cho chorus, tăng cường độ", duration: "4-8 bars" },
                { id: "pre-chorus-buildup", name: "Pre-Chorus (Build-up)", description: "Pre-chorus với build-up mạnh mẽ", duration: "4-8 bars" },
                { id: "pre-chorus-transition", name: "Pre-Chorus (Spoken → Sung transition)", description: "Chuyển từ nói sang hát", duration: "4-8 bars" }
            ]
        },
        "Chorus": {
            icon: "",
            color: "#f59e0b",
            variants: [
                { id: "chorus", name: "Chorus", description: "Điệp khúc chính, phần catchy và dễ nhớ nhất", duration: "8-16 bars" },
                { id: "chorus-hook-heavy", name: "Chorus (Hook-heavy)", description: "Chorus tập trung vào hook mạnh", duration: "8-16 bars" },
                { id: "chorus-minimal", name: "Chorus (Minimal)", description: "Chorus tối giản, tinh tế", duration: "8-16 bars" },
                { id: "chorus-anthem", name: "Chorus (Anthem / Wide)", description: "Chorus rộng, hoành tráng, đại chúng", duration: "8-16 bars" },
                { id: "chorus-call-response", name: "Chorus (Call & Response)", description: "Chorus dạng hỏi đáp", duration: "8-16 bars" }
            ]
        },
        "Post-Chorus": {
            icon: "",
            color: "#10b981",
            variants: [
                { id: "post-chorus", name: "Post-Chorus", description: "Phần sau chorus, duy trì năng lượng", duration: "4-8 bars" },
                { id: "post-chorus-vocal", name: "Post-Chorus (Vocal Hook)", description: "Post-chorus với vocal hook lặp lại", duration: "4-8 bars" },
                { id: "post-chorus-instrumental", name: "Post-Chorus (Instrumental Hook)", description: "Post-chorus với instrumental hook", duration: "4-8 bars" }
            ]
        },
        "Bridge": {
            icon: "",
            color: "#06b6d4",
            variants: [
                { id: "bridge", name: "Bridge", description: "Phần cầu nối, thay đổi không khí và giai điệu", duration: "8-16 bars" },
                { id: "bridge-spoken", name: "Bridge (Spoken Word)", description: "Bridge với lời nói, rap hoặc monologue ngắn", duration: "8-16 bars" },
                { id: "bridge-breakdown", name: "Bridge (Breakdown)", description: "Bridge dạng breakdown, giảm năng lượng", duration: "8-16 bars" },
                { id: "bridge-key-change", name: "Bridge (Key / Mood change)", description: "Bridge đổi tone hoặc mood hoàn toàn", duration: "8-16 bars" },
                { id: "bridge-monologue", name: "Bridge (Monologue)", description: "Bridge dạng độc thoại dài", duration: "8-16 bars" }
            ]
        },
        "Drop": {
            icon: "",
            color: "#ef4444",
            variants: [
                { id: "drop", name: "Drop", description: "Phần drop chính, cao trào của bài hát", duration: "8-16 bars" },
                { id: "drop-instrumental", name: "Drop (Instrumental)", description: "Drop không lời, chỉ nhạc", duration: "8-16 bars" },
                { id: "drop-vocal-chop", name: "Drop (Vocal Chop)", description: "Drop với vocal chops mạnh mẽ", duration: "8-16 bars" },
                { id: "drop-minimal", name: "Drop (Minimal / Bass-focused)", description: "Drop tối giản tập trung bass", duration: "8-16 bars" },
                { id: "drop-delayed", name: "Drop (Delayed)", description: "Drop trì hoãn, tạo tension", duration: "8-16 bars" }
            ]
        },
        "Breakdown-Interlude": {
            icon: "",
            color: "#6366f1",
            variants: [
                { id: "breakdown", name: "Breakdown", description: "Phần breakdown, giảm năng lượng đột ngột", duration: "4-8 bars" },
                { id: "breakdown-spoken", name: "Breakdown (Spoken Word)", description: "Breakdown với lời nói hoặc rap", duration: "4-8 bars" },
                { id: "interlude-dialogue", name: "Interlude (Dialogue)", description: "Interlude với đoạn hội thoại", duration: "4-8 bars" },
                { id: "interlude-ambient", name: "Interlude (Ambient)", description: "Interlude với ambient và sound effects", duration: "4-8 bars" }
            ]
        },
        "Outro-End": {
            icon: "",
            color: "#64748b",
            variants: [
                { id: "outro-instrumental", name: "Outro (Instrumental)", description: "Kết thúc không lời, chỉ nhạc", duration: "4-8 bars" },
                { id: "outro-spoken", name: "Outro (Spoken Word)", description: "Kết thúc với lời nói", duration: "4-8 bars" },
                { id: "outro-dialogue", name: "Outro (Dialogue)", description: "Kết thúc với đoạn hội thoại", duration: "4-8 bars" },
                { id: "outro-hook-reprise", name: "Outro (Hook reprise)", description: "Kết thúc lặp lại hook chính", duration: "4-8 bars" },
                { id: "end-hard-stop", name: "End (Hard stop)", description: "Kết thúc đột ngột, không fade", duration: "1-2 bars" },
                { id: "end-fade-out", name: "End (Fade out)", description: "Kết thúc fade out từ từ", duration: "4-8 bars" }
            ]
        }
    };

    // Initialize Structure System
    function initStructureSystem() {
        // Populate all dropdowns with variants
        Object.keys(STRUCTURE_CATEGORIES).forEach(categoryKey => {
            const category = STRUCTURE_CATEGORIES[categoryKey];
            const dropdown = document.querySelector(`.category-dropdown[data-category="${categoryKey}"]`);

            if (dropdown) {
                dropdown.innerHTML = category.variants.map(variant => `
                    <div class="variant-option" data-variant-id="${variant.id}" data-category="${categoryKey}">
                        <span class="variant-name">${variant.name}</span>
                        <span class="variant-duration">${variant.duration}</span>
                    </div>
                `).join('');
            }
        });

        // Setup category button toggles
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = btn.dataset.category;
                const dropdown = document.querySelector(`.category-dropdown[data-category="${category}"]`);
                const isOpen = dropdown && dropdown.classList.contains('open');

                // Close all dropdowns
                document.querySelectorAll('.category-dropdown').forEach(d => d.classList.remove('open'));
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));

                // Toggle current
                if (!isOpen && dropdown) {
                    dropdown.classList.add('open');
                    btn.classList.add('active');
                }
            });
        });

        // Setup variant selection
        document.querySelectorAll('.variant-option').forEach(option => {
            option.addEventListener('click', () => {
                const variantId = option.dataset.variantId;
                const categoryKey = option.dataset.category;

                // Add to structure
                currentStructure.push({ id: variantId, category: categoryKey });
                renderStructure();
                saveState();

                // Close dropdown
                document.querySelectorAll('.category-dropdown').forEach(d => d.classList.remove('open'));
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.structure-category')) {
                document.querySelectorAll('.category-dropdown').forEach(d => d.classList.remove('open'));
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            }
        });
    }

    // Render Structure with Icons, Colors, and Delete Buttons
    function renderStructure() {
        if (!structureDisplay) return;
        structureDisplay.innerHTML = '';

        if (currentStructure.length === 0) {
            structureDisplay.innerHTML = '<span class="placeholder-text">Chưa chọn cấu trúc...</span>';
            return;
        }

        currentStructure.forEach((item, index) => {
            // Find variant data
            const category = STRUCTURE_CATEGORIES[item.category];
            if (!category) return;

            const variant = category.variants.find(v => v.id === item.id);
            if (!variant) return;

            const tag = document.createElement('div');
            tag.className = 'structure-tag';
            tag.dataset.index = index;
            tag.dataset.variantId = item.id;
            tag.dataset.category = item.category;
            tag.style.borderColor = category.color + '55';
            tag.style.background = `linear-gradient(135deg, ${category.color}25, ${category.color}10)`;

            tag.innerHTML = `
                <span class="structure-tag-icon">${category.icon}</span>
                <span class="structure-tag-name">${variant.name}</span>
                <span class="structure-tag-remove">×</span>
            `;

            // Hover tooltip
            tag.addEventListener('mouseenter', (e) => showStructureTooltip(e, variant, category));
            tag.addEventListener('mouseleave', hideStructureTooltip);

            // Delete individual tag
            const removeBtn = tag.querySelector('.structure-tag-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentStructure.splice(index, 1);
                renderStructure();
                saveState();
            });

            structureDisplay.appendChild(tag);
        });
    }

    // Show Tooltip
    function showStructureTooltip(event, variant, category) {
        const tooltip = document.getElementById('structure-tooltip');
        if (!tooltip) return;

        tooltip.innerHTML = `
            <div class="tooltip-header">
                <span class="tooltip-title">${variant.name}</span>
            </div>
            <div class="tooltip-description">${variant.description}</div>
            <div class="tooltip-duration">⏱️ ${variant.duration}</div>
        `;

        const rect = event.currentTarget.getBoundingClientRect();
        const tooltipHeight = 120; // Approximate height

        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.top - (tooltipHeight / 2) - 18) + 'px';
        tooltip.classList.add('visible');
    }

    // Hide Tooltip
    function hideStructureTooltip() {
        const tooltip = document.getElementById('structure-tooltip');
        if (tooltip) tooltip.classList.remove('visible');
    }

    // Clear All Button
    if (clearStructureBtn) {
        clearStructureBtn.addEventListener('click', () => {
            currentStructure = [];
            renderStructure();
            saveState();
        });
    }

    // Initialize on load
    if (document.querySelector('.category-btn')) {
        initStructureSystem();
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
        'saved_gender', 'saved_region', 'prompt_history', 'saved_system_prompt', 'saved_structure', 'saved_music_focus',
        'saved_rhythm_flow', 'saved_instrumentation', 'saved_engineering', 'saved_energy', 'is_clean_lyrics', 'is_custom_lyrics', 'is_instrumental'
    ], (res) => {
        if (res.gemini_api_key) apiKeyInput.value = res.gemini_api_key;
        if (res.gemini_model) modelSelect.value = res.gemini_model;
        if (res.saved_concept) conceptInput.value = res.saved_concept;
        if (res.saved_artist) artistInput.value = res.saved_artist;
        if (res.saved_gender) genderSelect.value = res.saved_gender;
        if (res.saved_region) regionSelect.value = res.saved_region;
        if (res.is_clean_lyrics !== undefined && cleanLyricsMode) cleanLyricsMode.checked = res.is_clean_lyrics;
        if (res.is_instrumental !== undefined && instrumentalMode) {
            instrumentalMode.checked = res.is_instrumental;
            // Trigger change to update UI
            instrumentalMode.dispatchEvent(new Event('change'));
        }
        if (res.saved_music_focus && musicFocusSelect) musicFocusSelect.value = res.saved_music_focus;
        if (res.saved_rhythm_flow && rhythmFlowSelect) rhythmFlowSelect.value = res.saved_rhythm_flow;
        if (res.saved_language && languageSelect) {
            languageSelect.value = res.saved_language;
            // Initial check for region visibility
            if (languageSelect.value === 'Vietnamese') {
                regionContainer.style.display = 'block';
            } else {
                regionContainer.style.display = 'none';
            }
        }

        // Load Advanced Settings
        if (res.saved_system_prompt && customSystemPromptInput) customSystemPromptInput.value = res.saved_system_prompt;
        if (res.saved_structure) {
            currentStructure = res.saved_structure;
            renderStructure();
        }

        const restoreChips = (containerId, savedVals) => {
            if (!savedVals) return;
            const container = document.getElementById(containerId);
            if (!container) return;
            container.querySelectorAll('.pro-chip').forEach(chip => {
                if (savedVals.includes(chip.dataset.val)) {
                    chip.classList.add('active');
                }
            });
        };

        restoreChips('instrument-chips', res.saved_instrumentation);
        restoreChips('engineering-chips', res.saved_engineering);
        restoreChips('energy-chips', res.saved_energy);
        restoreChips('vocal-traits', res.saved_vocal_traits);
        restoreChips('vocal-presets', res.saved_vocal_presets);
        restoreChips('emotion-chips', res.saved_emotions);

        if (res.saved_custom_vibe) {
            customVibeInput.value = res.saved_custom_vibe;
            selectedVibe = res.saved_custom_vibe;
            vibeChips.forEach(c => c.classList.remove('active'));
        } else if (res.saved_vibe) {
            selectedVibe = res.saved_vibe;
            restoreVibeChip(selectedVibe);
        }

        if (res.is_custom_lyrics !== undefined && inputModeToggle) {
            inputModeToggle.checked = res.is_custom_lyrics;
            updateInputModeUI();
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
            saved_language: languageSelect ? languageSelect.value : "Vietnamese",
            is_clean_lyrics: cleanLyricsMode ? cleanLyricsMode.checked : false,
            // Save Advanced Settings
            saved_system_prompt: customSystemPromptInput ? customSystemPromptInput.value.trim() : "",
            saved_structure: currentStructure,
            saved_music_focus: musicFocusSelect ? musicFocusSelect.value : "balanced",
            saved_rhythm_flow: rhythmFlowSelect ? rhythmFlowSelect.value : "default",
            saved_instrumentation: Array.from(document.querySelectorAll('#instrument-chips .pro-chip.active')).map(c => c.dataset.val),
            saved_engineering: Array.from(document.querySelectorAll('#engineering-chips .pro-chip.active')).map(c => c.dataset.val),
            saved_energy: Array.from(document.querySelectorAll('#energy-chips .pro-chip.active')).map(c => c.dataset.val),
            is_custom_lyrics: inputModeToggle ? inputModeToggle.checked : false,
            is_instrumental: instrumentalMode ? instrumentalMode.checked : false
        });
    };

    // Events for saving state
    const inputsToSave = [conceptInput, apiKeyInput, artistInput, customVibeInput];
    if (customSystemPromptInput) inputsToSave.push(customSystemPromptInput);

    inputsToSave.forEach(el => {
        if (el) el.addEventListener('input', saveState);
    });

    if (languageSelect) {
        languageSelect.addEventListener('change', () => {
            if (languageSelect.value === 'Vietnamese') {
                regionContainer.style.display = 'block';
            } else {
                regionContainer.style.display = 'none';
                regionSelect.value = 'Standard';
            }
            saveState();
        });
    }

    [genderSelect, regionSelect, modelSelect, languageSelect, musicFocusSelect, rhythmFlowSelect, cleanLyricsMode].forEach(el => {
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
    function addToHistory(concept, vibe, type = 'compose', meta = null) {
        chrome.storage.local.get(['prompt_history'], (res) => {
            let history = res.prompt_history || [];
            const newItem = {
                id: Date.now(),
                concept: concept,
                vibe: vibe,
                type: type,
                meta: meta,
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
            const isPolish = item.type === 'polish';
            el.innerHTML = `
                <div class="history-item-main">
                    <div class="history-concept">${renderMarkdown(item.concept)}</div>
                    <div class="history-meta">
                        ${isPolish ? '<span class="history-tag polish">CHỈNH SỬA</span>' : '<span class="history-tag compose">SÁNG TÁC</span>'}
                        <span class="vibe-tag">${item.vibe}</span>
                        <span>${item.timestamp.split(' ')[1]}</span> 
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn continue-btn" title="Tiếp tục chỉnh sửa">
                        <i data-lucide="pencil-line"></i>
                    </button>
                    <button class="delete-history-btn" title="Xóa">×</button>
                </div>
            `;

            // Continue Editing / Restore logic
            const restoreAction = () => {
                conceptInput.value = item.concept;
                selectedVibe = item.vibe;
                customVibeInput.value = "";

                // If it's a polish item, auto-switch to LYRICS mode
                if (isPolish && !inputModeToggle.checked) {
                    inputModeToggle.checked = true;
                    inputModeToggle.dispatchEvent(new Event('change'));
                }

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

                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                const composeTabBtn = document.querySelector('[data-tab="compose"]');
                if (composeTabBtn) composeTabBtn.classList.add('active');
                const composeTabContent = document.getElementById('tab-compose');
                if (composeTabContent) composeTabContent.classList.add('active');

                updateLog(`Khôi phục: ${isPolish ? 'Bản chỉnh sửa' : 'Ý tưởng sáng tác'}...`);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            el.addEventListener('click', (e) => {
                if (e.target.closest('.delete-history-btn')) return;
                restoreAction();
            });

            const continueBtn = el.querySelector('.continue-btn');
            if (continueBtn) continueBtn.onclick = (e) => {
                e.stopPropagation();
                restoreAction();
            };

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

        // Re-render icons for dynamic content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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
                language: languageSelect ? languageSelect.value : "Vietnamese",
                apiKey: apiKey,
                model: modelSelect.value,
                isInstrumental: isInstrumental,
                isCustomLyrics: isCustomLyrics,
                isCleanLyrics: cleanLyricsMode ? cleanLyricsMode.checked : false,
                customSystemPrompt: customSystemPromptInput ? customSystemPromptInput.value.trim() : "",
                customStructure: currentStructure,
                musicFocus: musicFocusSelect ? musicFocusSelect.value : "balanced",
                rhythmFlow: rhythmFlowSelect ? rhythmFlowSelect.value : "default",
                instrumentation: Array.from(document.querySelectorAll('#instrument-chips .pro-chip.active')).map(c => c.dataset.val),
                engineering: Array.from(document.querySelectorAll('#engineering-chips .pro-chip.active')).map(c => c.dataset.val),
                energy: Array.from(document.querySelectorAll('#energy-chips .pro-chip.active')).map(c => c.dataset.val),
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
    setupMultiSelectChips('instrument-chips');
    setupMultiSelectChips('engineering-chips');
    setupMultiSelectChips('energy-chips');

    // ============================================
    // AI MUSIC ASSISTANTS LOGIC (LOBBY MODE)
    // ============================================

    function loadAssistants() {
        chrome.storage.local.get(['music_assistants'], (res) => {
            currentAssistants = res.music_assistants || [
                {
                    id: 'agent-v-pop',
                    name: 'V-Pop Producer',
                    prompt: 'Bạn là một Music Producer chuyên nghiệp tại một studio lớn, am hiểu thị trường V-Pop Viral. Hãy giao tiếp như một cộng sự (co-producer). Đừng liệt kê dữ liệu một cách máy móc. Hãy đưa ra những nhận xét sắc sảo về bản phối, giai điệu hoặc ý tưởng hiện tại. Nếu thấy gì đó chưa ổn, hãy thẳng thắn góp ý và đưa ra phương án cải thiện cụ thể theo ngôn ngữ chuyên môn (VD: thay đổi preset synth, nén vocal, hay điều chỉnh tempo). Luôn chào hỏi thân thiện và gợi mở hội thoại.',
                    role: 'Hòa âm phối khí',
                    avatar: '🎵',
                    model: 'gemini-2.0-flash',
                    messages: []
                },
                {
                    id: 'agent-lyricist',
                    name: 'Lyric Architect',
                    prompt: 'Bạn là một nhà thơ và nhạc sĩ viết lời (lyricist) có khả năng tạo ra những câu chữ "chạm" đến trái tim. Hãy giúp người dùng trau chuốt lời ca, xây dựng cốt truyện hoặc tìm kiếm vần điệu mới lạ. Giao tiếp tự nhiên, giàu cảm xúc nhưng vẫn chuyên nghiệp. Đừng chỉ trả lời vắn tắt, hãy gợi ý cách phát triển tứ thơ hoặc thay đổi cấu trúc điệp khúc để tạo cao trào.',
                    role: 'Viết lời & Ý tưởng',
                    avatar: '✍️',
                    model: 'gemini-2.0-pro-exp-02-05',
                    messages: []
                }
            ];
            renderAssistantList();
        });
    }

    function renderAssistantList() {
        if (!assistantsGrid) return;
        assistantsGrid.innerHTML = '';
        currentAssistants.forEach(assistant => {
            const card = document.createElement('div');
            card.className = `assistant-card ${assistant.id === activeAssistantId ? 'active' : ''}`;
            card.innerHTML = `
                <button class="card-settings-btn" title="Chỉnh sửa">⚙️</button>
                <span class="card-avatar">${assistant.avatar || '🤖'}</span>
                <span class="card-name">${assistant.name}</span>
                <span class="card-role">${assistant.role || 'Trợ lý'}</span>
                <div class="card-status"><i></i> Online</div>
            `;

            // Setup Edit button inside card
            card.querySelector('.card-settings-btn').onclick = (e) => {
                e.stopPropagation();
                openAssistantEditor(assistant.id);
            };

            // Setup card click to Open Chat on Suno
            card.onclick = () => activateAssistantOnSuno(assistant);

            assistantsGrid.appendChild(card);
        });
    }

    async function activateAssistantOnSuno(assistant) {
        activeAssistantId = assistant.id;
        renderAssistantList();

        // 1. Get current music context
        const musicContext = getMusicContext();

        // 2. Notify Suno Page to open chat
        chrome.tabs.query({ url: "*://suno.com/*" }, (tabs) => {
            if (tabs.length === 0) {
                updateLog("Vui lòng mở trang suno.com để trò chuyện với trợ lý.");
                return;
            }

            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {
                action: "OPEN_ASSISTANT_CHAT",
                assistant: assistant,
                musicContext: musicContext
            }, (res) => {
                if (chrome.runtime.lastError) {
                    updateLog("Không thể kết nối với trang Suno. Thử tải lại trang.");
                } else {
                    updateLog(`Đã kích hoạt ${assistant.name} trên trang Suno!`);
                    // Optionally close popup after activation to let user focus on Suno
                    // window.close(); 
                }
            });
        });
    }

    function getMusicContext() {
        const concept = conceptInput.value.trim();
        const artist = artistInput.value.trim();
        const vibe = selectedVibe;
        const instrumentation = Array.from(document.querySelectorAll('#instrument-chips .pro-chip.active')).map(c => c.dataset.val);
        const engineering = Array.from(document.querySelectorAll('#engineering-chips .pro-chip.active')).map(c => c.dataset.val);
        const emotions = Array.from(document.querySelectorAll('#emotion-chips .pro-chip.active')).map(c => c.dataset.val);

        return `
[CONTEXT DỮ LIỆU ÂM NHẠC HIỆN TẠI]:
- Ý tưởng/Lời: ${concept.substring(0, 500)}
- Nghệ sĩ truyền cảm hứng: ${artist || 'N/A'}
- Phong cách chủ đạo: ${vibe}
- Nhạc cụ đã chọn: ${instrumentation.join(', ') || 'Auto'}
- Kỹ thuật Mix: ${engineering.join(', ') || 'Standard'}
- Cảm xúc: ${emotions.join(', ') || 'Balanced'}
- Chế độ: ${inputModeToggle.checked ? 'Lyrics Mode' : 'Concept Mode'}
        `.trim();
    }

    function saveAssistants() {
        chrome.storage.local.set({ music_assistants: currentAssistants });
    }

    // Modal Control
    if (btnAddAssistantPro) {
        btnAddAssistantPro.onclick = () => {
            editingAssistantId = null;
            editAssistantName.value = '';
            editAssistantPrompt.value = '';
            editAssistantKey.value = '';
            editAssistantModel.value = 'gemini-2.0-flash';
            btnDeleteAssistant.style.display = 'none';
            assistantEditorModal.style.display = 'flex';
        };
    }

    function openAssistantEditor(id) {
        const assistant = currentAssistants.find(a => a.id === id);
        if (!assistant) return;
        editingAssistantId = assistant.id;
        editAssistantName.value = assistant.name;
        editAssistantPrompt.value = assistant.prompt;
        editAssistantKey.value = assistant.apiKey || '';
        editAssistantModel.value = assistant.model || 'gemini-2.0-flash';
        btnDeleteAssistant.style.display = 'block';
        assistantEditorModal.style.display = 'flex';
    }

    if (closeAssistantEditor) {
        closeAssistantEditor.onclick = () => assistantEditorModal.style.display = 'none';
    }

    if (btnSaveAssistant) {
        btnSaveAssistant.onclick = () => {
            const name = editAssistantName.value.trim();
            const prompt = editAssistantPrompt.value.trim();
            if (!name || !prompt) return;

            if (editingAssistantId) {
                // Update
                const idx = currentAssistants.findIndex(a => a.id === editingAssistantId);
                if (idx !== -1) {
                    currentAssistants[idx].name = name;
                    currentAssistants[idx].prompt = prompt;
                    currentAssistants[idx].apiKey = editAssistantKey.value.trim();
                    currentAssistants[idx].model = editAssistantModel.value;
                }
            } else {
                // Create
                const newAssistant = {
                    id: 'agent-' + Date.now(),
                    name: name,
                    prompt: prompt,
                    role: 'Custom Assistant',
                    avatar: '🤖',
                    model: editAssistantModel.value,
                    apiKey: editAssistantKey.value.trim(),
                    messages: []
                };
                currentAssistants.push(newAssistant);
            }

            saveAssistants();
            renderAssistantList();
            assistantEditorModal.style.display = 'none';
        };
    }

    if (btnDeleteAssistant) {
        btnDeleteAssistant.onclick = () => {
            if (!editingAssistantId || !confirm("Bạn có chắc chắn muốn xóa trợ lý này?")) return;
            currentAssistants = currentAssistants.filter(a => a.id !== editingAssistantId);
            saveAssistants();
            renderAssistantList();
            assistantEditorModal.style.display = 'none';
        };
    }

    // Initialize Assistant Tab
    loadAssistants();

    // Helper function to escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // NEW: Simple Markdown/Lyrics Renderer
    function renderMarkdown(text) {
        if (!text) return '';
        let html = escapeHtml(text);

        // Bold: **text**
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic: *text* (optional)
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // New lines: replace with <br>
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
