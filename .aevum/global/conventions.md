# Suno-Hit-Maker Coding Conventions

## JavaScript
- Use ES6+ features wherever possible.
- Favor `const` over `let`, and never use `var`.
- Use `async/await` for asynchronous operations.
- Naming: `camelCase` for variables/functions, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants.

## UI/CSS
- Use CSS Variables defined in `popup.css` for consistent styling.
- Prefix all Suno-injected classes with `shm-` to avoid conflicts.
- Favor `flex` and `grid` layouts.

## Extension Specifics
- Always check `chrome.runtime.lastError` after messaging.
- Use `chrome.storage.local` for all state persistence.
