# Suno-Hit-Maker Architecture (Aevum)

This project is in the process of migrating from a monolithic, layer-based architecture to a **Feature-First Architecture**.

## Principles
1. **Feature Encapsulation**: Each feature (e.g., Magic Polish, See The Sound) should reside in its own directory under `src/features/`.
2. **Logic vs. UI separation**: Functional logic (API calls, data processing) should be separate from DOM manipulation.
3. **Global Infrastructure**: Shared services like AI handling and Event management reside in `src/core/`.
4. **Clean Entry Points**: `popup.js` and `background.js` act as bootstrappers that initialize feature modules.

## Directory Map
- `src/core/`: Foundation layers.
- `src/features/`: Functional domains.
- `src/shared/`: Cross-feature UI components and utilities.
- `src/content/`: Domain-specific Suno.com injection logic.
