/*
 * VNE PANEL HOST
 *
 * Keep this host deliberately small.  The native MSFS <ingame-ui> component
 * owns the actual window frame and header controls.  VNE does not implement
 * replacement move/resize/close controls; telemetry is handled separately by the
 * native MSFS SimVar data source.
 */
class VneGaugePanelElement extends TemplateElement {
    constructor() {
        super(...arguments);
        this.panelActive = false;
        this.ingameUi = null;
        this.hideUiTimer = null;
        this.windowUiVisible = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.ingameUi = this.querySelector('ingame-ui');
        if (this.ingameUi) {
            this.ingameUi.addEventListener('panelActive', () => { this.panelActive = true; });
            this.ingameUi.addEventListener('panelInactive', () => { this.panelActive = false; });
        }

        const gauge = this.querySelector('#VneGaugePanelWrap');
        if (gauge) {
            /*
             * WINDOW-MANAGEMENT GESTURE
             *
             * Nothing on the VNE flight display itself is clickable.  A click
             * anywhere on the gauge is therefore reserved as an explicit request
             * to expose the native MSFS window controls and resize boundary.
             * This avoids a header appearing merely because the mouse crossed the
             * gauge while flying.
             */
            gauge.addEventListener('click', () => this.showWindowUi());
        }

        /*
         * While the management UI is visible, pointer activity counts as use and
         * postpones auto-hide.  This gives the pilot time to find a resize edge or
         * a native header control instead of making the furniture vanish mid-use.
         */
        this.addEventListener('pointermove', () => {
            if (this.windowUiVisible) this.armWindowUiHide();
        });
        this.addEventListener('pointerdown', () => {
            if (this.windowUiVisible) this.armWindowUiHide();
        });
    }

    showWindowUi() {
        this.windowUiVisible = true;
        document.body.classList.add('show-ui');
        this.armWindowUiHide();
    }

    armWindowUiHide() {
        clearTimeout(this.hideUiTimer);
        this.hideUiTimer = setTimeout(() => this.hideWindowUi(), 5000);
    }

    hideWindowUi() {
        this.windowUiVisible = false;
        document.body.classList.remove('show-ui');
    }
}

/* Keep the custom-element identity VNE-specific to avoid UI namespace collisions. */
window.customElements.define('vne-gauge-panel', VneGaugePanelElement);
checkAutoload();
