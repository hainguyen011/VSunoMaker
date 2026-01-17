# Selective Regeneration Implementation Plan

## Goal
Modify the "Regenerate" functionality so that it only regenerates the specific content (Lyrics or Style) associated with the targeted element, rather than regenerating both every time.

## Proposed Changes

### `src/content/suno-inject.js`
- Update `handleRegenerate(targetType)` to pass `mode: targetType` (e.g., 'lyrics' or 'style') in the `COMPOSE_WITH_AI` message.
- Update `fillSunoForm(data)` logic to handle partial data updates. If `data.lyrics` is present, update lyrics; if `data.style` is present, update style.

### `src/background/background.js`
- Update `composeMusic` function signature to accept `mode`.
- Modify the AI prompt generation logic:
    - If `mode === 'lyrics'`: Request only `lyrics` and `title` (optional, or keep same title context if possible, but currently we generate fresh). Actually, for regeneration, maybe we just want that part.
    - If `mode === 'style'`: Request only `style`.
    - If `mode === 'full'` (default): Keep existing behavior.
- Update the `JSON` output format instruction in the prompt based on the mode.

## Verification Plan

### Manual Verification
1.  **Reload Extension**: Reload the extension in `chrome://extensions`.
2.  **Open Suno**: Go to `https://suno.com/create`.
3.  **Injector Mode**: Use the "Inspector" from popup to select the Lyrics text area.
4.  **Regenerate Lyrics**: Click the "Regenerate" button on the Lyrics highlight.
    -   *Expected Result*: Only the Lyrics field updates. The Style field should remain unchanged.
5.  **Regenerate Style**: Use Inspector to select the Style input. Click "Regenerate".
    -   *Expected Result*: Only the Style field updates. The Lyrics field should remain unchanged.
6.  **Full Generation**: Use the "MAKE HIT!" button in the popup.
    -   *Expected Result*: Both fields update as before.
