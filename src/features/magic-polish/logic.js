/**
 * Magic Polish Feature - Logic
 * Handles communication with the background script for lyrics polishing.
 */

export class MagicPolishLogic {
    async polishLyrics(params, apiKey, model) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: "POLISH_LYRICS",
                params: params,
                apiKey: apiKey,
                model: model
            }, (response) => {
                resolve(response);
            });
        });
    }

    async regenerateReviewItem(params, apiKey, model) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: "REGENERATE_REVIEW_ITEM",
                params: params,
                apiKey: apiKey,
                model: model
            }, (response) => {
                resolve(response);
            });
        });
    }
}
