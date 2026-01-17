/**
 * Suno Hit-Maker AI - Popup Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const conceptInput = document.getElementById('concept-input');
    const composeBtn = document.getElementById('compose-btn');
    const statusLog = document.getElementById('status-log');
    let selectedVibe = "V-Pop Viral";
    const customVibeInput = document.getElementById('custom-vibe-input');
    const vibeChips = document.querySelectorAll('.vibe-chip');
    const genderSelect = document.getElementById('vocal-gender');
    const regionSelect = document.getElementById('vocal-region');

    // Load and restore saved state
    chrome.storage.local.get(['gemini_api_key', 'saved_concept', 'saved_artist', 'saved_vibe', 'saved_custom_vibe', 'saved_gender', 'saved_region'], (res) => {
        if (res.gemini_api_key) document.getElementById('api-key').value = res.gemini_api_key;
        if (res.saved_concept) conceptInput.value = res.saved_concept;
        if (res.saved_artist) document.getElementById('artist-input').value = res.saved_artist;
        if (res.saved_gender) genderSelect.value = res.saved_gender;
        if (res.saved_region) regionSelect.value = res.saved_region;

        if (res.saved_custom_vibe) {
            customVibeInput.value = res.saved_custom_vibe;
            selectedVibe = res.saved_custom_vibe;
            vibeChips.forEach(c => c.classList.remove('active'));
        } else if (res.saved_vibe) {
            selectedVibe = res.saved_vibe;
            vibeChips.forEach(chip => {
                if (chip.dataset.vibe === selectedVibe) {
                    vibeChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                }
            });
        }
    });

    // Save state on input
    const saveState = () => {
        chrome.storage.local.set({
            gemini_api_key: document.getElementById('api-key').value.trim(),
            saved_concept: conceptInput.value.trim(),
            saved_artist: document.getElementById('artist-input').value.trim(),
            saved_vibe: selectedVibe,
            saved_custom_vibe: customVibeInput.value.trim(),
            saved_gender: genderSelect.value,
            saved_region: regionSelect.value
        });
    };

    conceptInput.addEventListener('input', saveState);
    document.getElementById('api-key').addEventListener('input', saveState);
    document.getElementById('artist-input').addEventListener('input', saveState);
    genderSelect.addEventListener('change', saveState);
    regionSelect.addEventListener('change', saveState);

    vibeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            vibeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedVibe = chip.dataset.vibe;
            customVibeInput.value = ""; // Xóa custom khi chọn chip
            saveState();
            updateLog(`> Vibe switched to: ${selectedVibe}`);
        });
    });

    customVibeInput.addEventListener('input', () => {
        if (customVibeInput.value.trim() !== "") {
            vibeChips.forEach(c => c.classList.remove('active'));
            selectedVibe = customVibeInput.value.trim();
        } else {
            // Nếu xóa hết custom, quay lại vibe đầu tiên mặc định
            const firstChip = vibeChips[0];
            firstChip.classList.add('active');
            selectedVibe = firstChip.dataset.vibe;
        }
        saveState();
    });

    // Inspector Events
    document.getElementById('inspect-lyrics').addEventListener('click', () => startInspector('lyrics'));
    document.getElementById('inspect-style').addEventListener('click', () => startInspector('style'));

    async function startInspector(type) {
        updateLog(`> Studio: Đang soi vùng ${type.toUpperCase()}...`);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: "START_INSPECTOR", targetType: type });
        window.close(); // Đóng popup để người dùng thao tác trên trang
    }

    composeBtn.addEventListener('click', async () => {
        const concept = conceptInput.value.trim();
        const artist = document.getElementById('artist-input').value.trim();
        const apiKey = document.getElementById('api-key').value.trim();
        const gender = genderSelect.value;
        const region = regionSelect.value;

        if (!concept || !apiKey) {
            updateLog("! Error: Vui lòng nhập Concept và API Key.");
            return;
        }

        updateLog("> Connecting to Gemini Deep Music AI...");
        composeBtn.disabled = true;
        composeBtn.innerText = "DANG SANG TAC...";

        try {
            // Gọi AI thật từ background
            chrome.runtime.sendMessage({
                action: "COMPOSE_WITH_AI",
                concept: concept,
                vibe: selectedVibe,
                artist: artist,
                gender: gender,
                region: region,
                apiKey: apiKey
            }, async (aiResponse) => {
                if (!aiResponse || !aiResponse.success) {
                    updateLog("! AI Error: " + (aiResponse ? aiResponse.error : "Unknown"));
                    resetBtn();
                    return;
                }

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
                        updateLog("! Lỗi: Hãy F5 (Refresh) trang Suno để kích hoạt Extension.");
                        console.error("Connection error:", chrome.runtime.lastError.message);
                    } else if (injectResponse && injectResponse.success) {
                        updateLog("> SUCCESS: Kiệt tác đã được điền!");
                        // Sau khi thành công, có thể xóa concept để sẵn sàng cho bài tiếp theo nếu muốn
                        // conceptInput.value = "";
                        // saveState();
                    } else {
                        updateLog("! Failed: Hãy bật 'Custom Mode' trên Suno.");
                    }
                    resetBtn();
                });
            });

        } catch (error) {
            updateLog("! System Crash.");
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

    function simulateAIComposing(concept, vibe) {
        // Đây là ví dụ về nội dung AI trả về với nhạc lý chuyên sâu
        const styles = {
            "V-Pop Viral": "Modern V-Pop, Ballad, 68 BPM, Emotional Piano, Atmospheric Synth, Soulful Male Vocals, High-end Reverb, Catchy Melody.",
            "Indie Chill": "Acoustic Indie, Lofi, 75 BPM, Gentle Guitar, Subtle Percussion, Dreamy Vocals, Intimate Vibe.",
            "Vinahouse Hit": "Vinahouse, 140 BPM, Deep Bass, Punchy Kicks, Lead Synth, Energy, Club Anthem.",
            "US-UK Modern": "Synth-pop, 110 BPM, 80s Inspired, Groove, Funky Bassline, Bright Vocals, Radio Ready."
        };

        return {
            title: "Kiệt Tác: " + concept.substring(0, 15),
            style: styles[vibe] || styles["V-Pop Viral"],
            lyrics: `[Verse 1]\n${concept} giữa những màn mưa rơi\nLòng vẫn còn thương, dù ta đã xa rời\nKỷ niệm ngày xưa, giờ tan thành mây khói\nChỉ còn lại anh, với nỗi nhớ không lời.\n\n[Chorus]\nĐừng để tình tan trong những hư vô\nĐừng để lòng đau thêm những mơ hồ\nKiệt tác này anh viết riêng cho em\nGiữa bầu trời đêm, lấp lánh như sương mềm.`
        };
    }
});
