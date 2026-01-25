/**
 * Settings Feature - UI
 */
import { fetchModels } from '../../core/ai-service.js';
import { updateLog } from '../../shared/utils.js';

export class SettingsUI {
    constructor() {
        this.apiKeyInput = document.getElementById('api-key');
        this.modelSelect = document.getElementById('gemini-model');
        this.statusLog = document.getElementById('status-log');

        // Find or Create wrapper for the "Check Models" button
        this.modelPanel = this.modelSelect.parentElement; // div.input-panel
    }

    mount() {
        if (!this.modelPanel) return;

        // Add "Check Models" button if not exists
        if (!document.getElementById('btn-check-models')) {
            const btn = document.createElement('button');
            btn.id = 'btn-check-models';
            btn.className = 'mini-btn'; // Use existing class or style inline
            btn.style.marginTop = '8px';
            btn.style.width = '100%';
            btn.innerText = '🔄 Cập nhật danh sách Model';
            btn.title = "Tải danh sách model mới nhất từ Google";

            this.modelPanel.appendChild(btn);

            btn.onclick = () => this.handleCheckModels();
        }
    }

    async handleCheckModels() {
        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            updateLog(this.statusLog, "Lỗi: Cần nhập API Key trước.");
            return;
        }

        const btn = document.getElementById('btn-check-models');
        if (btn) {
            btn.disabled = true;
            btn.innerText = "Đang tải...";
        }
        updateLog(this.statusLog, "System: Đang lấy danh sách Model...");

        try {
            const models = await fetchModels(apiKey);

            // Clear current options
            this.modelSelect.innerHTML = '';

            // Add options
            models.sort().reverse().forEach(modelId => {
                const opt = document.createElement('option');
                opt.value = modelId;
                opt.innerText = modelId; // e.g. gemini-1.5-flash
                this.modelSelect.appendChild(opt);
            });

            if (!Array.isArray(models) || models.length === 0) {
                updateLog(this.statusLog, "Không tìm thấy model khả dụng.");
                return;
            }

            // Try to re-select a reasonable default if previous one is gone
            if (models.length > 0) {
                // Prefer "flash" models as default if user hasn't selected
                const defaultModel = models.find(m => m.includes('flash')) || models[0];
                this.modelSelect.value = defaultModel;
            }

            updateLog(this.statusLog, `Success: Đã tìm thấy ${models.length} hình mẫu!`);

            // Save logic is handled by main popup 'change' listener, 
            // but we might want to trigger it manually to save the new list? 
            // Actually verifying valid model is stored in local storage is handled by 'change'.
            // Here we just updated the UI.

        } catch (error) {
            updateLog(this.statusLog, "Lỗi: " + error.message);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerText = '🔄 Cập nhật danh sách Model';
            }
        }
    }
}
