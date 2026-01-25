/**
 * Shared Utilities
 */

export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function renderMarkdown(text) {
    if (!text) return '';
    let html = escapeHtml(text);

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* (optional)
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // New lines: replace with <br>
    html = html.replace(/\n/g, '<br>');

    return html;
}

let typingTimer = null;

export function updateLog(element, msg) {
    if (!element) return;

    // Clear previous timer
    if (typingTimer) clearInterval(typingTimer);

    element.innerText = "";
    let i = 0;
    typingTimer = setInterval(() => {
        if (i < msg.length) {
            element.innerText += msg.charAt(i);
            i++;
        } else {
            clearInterval(typingTimer);
        }
    }, 30); // Speed of typing
}

export function enableCustomResize(resizer, target) {
    let startY, startHeight;

    function initDrag(e) {
        e.preventDefault(); // Stop text selection
        startY = e.clientY;
        startHeight = parseInt(document.defaultView.getComputedStyle(target).height, 10);
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);
    }

    function doDrag(e) {
        target.style.height = (startHeight + e.clientY - startY) + 'px';
    }

    function stopDrag(e) {
        document.documentElement.removeEventListener('mousemove', doDrag, false);
        document.documentElement.removeEventListener('mouseup', stopDrag, false);
    }

    resizer.addEventListener('mousedown', initDrag, false);
}
