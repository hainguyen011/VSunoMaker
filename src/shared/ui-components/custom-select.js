/**
 * Custom Select Component
 * Replaces native <select> with stylable DOM elements while keeping sync.
 */

export class CustomSelect {
    constructor(selectElement) {
        this.select = selectElement;
        this.container = null;
        this.trigger = null;
        this.options = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        // Hide native select
        this.select.style.display = 'none';

        // Create Container
        this.container = document.createElement('div');
        this.container.className = 'custom-select-container';

        // Setup Trigger (The box you click)
        this.trigger = document.createElement('div');
        this.trigger.className = 'custom-select-trigger';
        this.updateTriggerText();

        // Add Arrow Icon
        const arrow = document.createElement('div');
        arrow.className = 'custom-arrow';
        this.trigger.appendChild(arrow);

        // Setup Options List
        this.options = document.createElement('div');
        this.options.className = 'custom-options';

        // Populate Options
        this.renderOptions();

        // Assemble
        this.container.appendChild(this.trigger);
        this.container.appendChild(this.options);

        // Insert after original select
        this.select.parentNode.insertBefore(this.container, this.select.nextSibling);

        // Event Listeners
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });

        // Listen for external updates to the original select (e.g. via code)
        // Note: 'change' event doesn't fire when value is set programmatically
        // We might need a manual refresh method or MutationObserver if needed.
        // For now, we assume this class drives the changes.

        this.select.addEventListener('change', () => this.updateTriggerText());
    }

    renderOptions() {
        this.options.innerHTML = '';
        Array.from(this.select.options).forEach(opt => {
            const div = document.createElement('div');
            div.className = 'custom-option';
            if (opt.selected) div.classList.add('selected');
            div.dataset.value = opt.value;
            div.innerText = opt.text;

            div.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectValue(opt.value);
            });

            this.options.appendChild(div);
        });
    }

    selectValue(value) {
        this.select.value = value;

        // Trigger generic 'change' event so existing logic works
        this.select.dispatchEvent(new Event('change'));

        // Update UI
        this.renderOptions(); // Re-render to update 'selected' class
        this.updateTriggerText();
        this.close();
    }

    updateTriggerText() {
        const selectedOption = this.select.options[this.select.selectedIndex];
        // Only update text part, keep arrow
        const textSpan = this.trigger.querySelector('span') || document.createElement('span');
        textSpan.innerText = selectedOption ? selectedOption.text : 'Select...';
        if (!this.trigger.contains(textSpan)) this.trigger.prepend(textSpan);
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        // Close all other custom selects first
        document.querySelectorAll('.custom-select-container').forEach(el => el.classList.remove('open'));

        this.container.classList.add('open');
        this.isOpen = true;

        // Scroll to selected option
        const selected = this.options.querySelector('.custom-option.selected');
        if (selected) {
            // Simple logic to scroll to view
            this.options.scrollTop = selected.offsetTop - this.options.offsetTop;
        }
    }

    close() {
        this.container.classList.remove('open');
        this.isOpen = false;
    }

    // Public method to force refresh (e.g. after model list update)
    refresh() {
        this.renderOptions();
        this.updateTriggerText();
    }
}
