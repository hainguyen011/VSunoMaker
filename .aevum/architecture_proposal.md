# Proposal: Feature-Based Architecture for Suno-Hit-Maker

## 1. Problem Analysis
The current structure is **Layer-Based** (popup, background, content), which works for small extensions but scales poorly.
- `src/popup/popup.js` is a **monolith** (~1800 lines) handling UI, Logic, API calls, and multiple distinct features (Lyrics, Image Analysis, Audio Analysis).
- **Hard to maintain**: Changing "Magic Polish" requires navigating through unrelated code for "See The Sound".
- **Hard to reuse**: Logic is tightly coupled with DOM manipulation.

## 2. Proposed Solution: Feature-First Architecture
We will organize code **by functionality (Feature)** rather than by file type.

### New Directory Structure
```
src/
├── core/                   # Shared core utilities (Base layers)
│   ├── ai-service.js       # Centralized AI API handler
│   ├── logger.js           # Centralized logging
│   └── events.js           # Event bus for communication
├── features/               # Independent feature modules
│   ├── magic-polish/       # Feature: Edit/Refine Lyrics
│   │   ├── index.js        # Entry point
│   │   ├── logic.js        # Business logic (Pure JS)
│   │   └── ui.js           # DOM manipulation
│   ├── see-the-sound/      # Feature: Image Analysis
│   │   ├── index.js
│   │   ├── api.js
│   │   └── ui.js
│   ├── hear-the-sound/     # Feature: Audio Analysis (New)
│   │   ├── index.js
│   │   └── ...
│   └── settings/           # Feature: API Key, Prompts Config
├── shared/                 # Shared UI components & Helpers
│   ├── ui-components/      # Reusable UI (Tabs, Modals)
│   └── utils.js            # Generic helpers
├── popup/
│   ├── popup.html          # Main skeleton only
│   ├── popup.js            # Main entry (Bootstrapper)
│   └── popup.css           # Global styles
└── background/             # Background scripts
```

## 3. Detailed Breakdown

### A. The "Feature" Module Pattern
Each feature folder (e.g., `src/features/magic-polish/`) should be self-contained:
- **`logic.js`**: Contains the state and business rules. *No DOM code here.*
- **`ui.js`**: Handles specific DOM elements for this feature.
- **`index.js`**: Exports an `init()` function to start the feature.

**Example `src/features/magic-polish/index.js`:**
```javascript
import { MagicPolishLogic } from './logic.js';
import { MagicPolishUI } from './ui.js';

export function initMagicPolish() {
    const logic = new MagicPolishLogic();
    const ui = new MagicPolishUI(logic);
    ui.mount();
}
```

### B. Core Services
Move global logic out of `popup.js`:
- **API Handling**: `src/core/ai-service.js` (Already started, needs refining).
- **State Management**: If features need to share state, use a simple Store or Event Bus.

### C. Main Bootstrapper (`popup.js`)
The main `popup.js` becomes very simple:
```javascript
import { initMagicPolish } from '../features/magic-polish/index.js';
import { initSeeTheSound } from '../features/see-the-sound/index.js';

document.addEventListener('DOMContentLoaded', () => {
    initMagicPolish();
    initSeeTheSound();
    // ...
});
```

## 4. Migration Strategy (Step-by-Step)
We do not rewrite everything at once. We refactor **one feature at a time**.

1.  **Phase 1: Setup Infrastructure**: Create folders `src/features`, `src/shared`.
2.  **Phase 2: Extract "Magic Polish"**:
    - Move Magic Polish logic from `popup.js` to `src/features/magic-polish/`.
    - Verify functionality.
3.  **Phase 3: Extract "See The Sound"**:
    - Move Image Analysis logic.
4.  **Phase 4: Extract "Hear The Sound"**:
    - Move Audio Analysis logic.
5.  **Phase 5: Cleanup**: Remove dead code from `popup.js`.

## 5. Benefits
- **Scalability**: Adding a new feature = adding a new folder. No fear of breaking existing code.
- **Readability**: Smaller, focused files.
- **Testability**: Logic is separated from UI, making it easier to write unit tests later.
