/**
 * Settings Feature - Entry Point
 */
import { SettingsUI } from './ui.js';

export function initSettings() {
    const ui = new SettingsUI();
    ui.mount();
}
