/**
 * hot-reload.js
 * Enables automatic extension reloading during development.
 */

let lastVersion = null;

async function checkReload() {
    try {
        const response = await fetch('http://localhost:8888/version');
        const data = await response.json();

        if (lastVersion !== null && data.version > lastVersion) {
            console.log('%c[HotReload] Change detected, reloading...', 'color: #33cc33; font-weight: bold;');
            chrome.runtime.reload();
        }

        lastVersion = data.version;
    } catch (err) {
        // Silent fail if watcher is not running
    }
}

// Check every 1.5 seconds to keep it lightweight
setInterval(checkReload, 1500);
console.log('%c[HotReload] Active and polling http://localhost:8888/version', 'color: #3399ff;');
