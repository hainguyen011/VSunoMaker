/**
 * Magic Polish Feature - Entry Point
 */
import { MagicPolishLogic } from './logic.js';
import { MagicPolishUI } from './ui.js';

export function initMagicPolish() {
    const logic = new MagicPolishLogic();
    const ui = new MagicPolishUI(logic);
    ui.mount();
    return ui;
}
