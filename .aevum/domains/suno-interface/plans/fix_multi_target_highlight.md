# Plan: Fix Multi-Target Highlight Sync

## Goal
Ensure that both Lyrics and Style highlight frames can be displayed simultaneously and remain "Locked" in the popup UI.

## Steps
1. Add `.is-locked` state to inspector buttons in `popup.css`.
2. Update `popup.js` to persist and reflect the "locked" state of both targets independently.
3. Verify that scanning one target doesn't clear the visual indicator of the other in the popup.
4. Ensure `suno-inject.js` continues to sync both highlights correctly.
