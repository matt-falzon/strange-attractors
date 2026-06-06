// Smooth parameter transitions
// Extends App.prototype (loaded after app.js, ui.js, controls.js)
//
// Provides setParamWithTransition() for animated param changes
// and updateParamTransitions() for per-frame lerp toward targets.

Object.assign(App.prototype, {

    /**
     * Start a smooth transition for a parameter.
     * Stores the target in this.targetParams; the per-frame
     * updateParamTransitions() lerps current values toward targets
     * at 0.08/frame and regenerates the trajectory when converged.
     */
    setParamWithTransition(key, target) {
        const attractor = ATTRACTORS[this.currentAttractor];
        const ranges = attractor.ranges;
        const [min, max] = ranges[key] || [0, 1];

        // Clamp to valid range
        target = Math.max(min, Math.min(max, target));

        // Lazily initialize targetParams on first call
        if (!this.targetParams) {
            this.targetParams = {};
        }

        this.targetParams[key] = target;

        // Update display immediately so the value reflects the target
        const valEl = document.getElementById(`val-${key}`);
        if (valEl) valEl.textContent = target.toFixed(3);
    },

    /**
     * Called once per animation frame.
     * Lerps each active param toward its target at 0.08/frame.
     * When all targets are converged (diff < 0.01), regenerates
     * the trajectory and clears the transition state.
     */
    updateParamTransitions() {
        if (!this.targetParams) return;

        const keys = Object.keys(this.targetParams);
        if (keys.length === 0) return;

        let allConverged = true;
        const lerpFactor = 0.08;

        keys.forEach(key => {
            const current = this.simulation.params[key];
            const target  = this.targetParams[key];

            const diff = target - current;
            if (Math.abs(diff) < 0.01) {
                // Snap to target when close enough
                this.simulation.params[key] = target;
            } else {
                this.simulation.params[key] += diff * lerpFactor;
                allConverged = false;
            }

            // Keep UI in sync with the lerping value
            const valEl = document.getElementById(`val-${key}`);
            if (valEl) {
                valEl.textContent = this.simulation.params[key].toFixed(3);
            }

            const sliderEl = document.querySelector(`input[data-param="${key}"]`);
            if (sliderEl) {
                sliderEl.value = this.simulation.params[key];
            }
        });

        if (allConverged) {
            this.regenerate();
            this.targetParams = {};
        }
    }
});

// Hook updateParamTransitions into the animation loop.
// We wrap animate() so every frame checks for pending transitions.
// Also rebind slider inputs so they use smooth transitions instead
// of direct param assignment + regenerate.

(function () {
    const originalAnimate = App.prototype.animate;

    App.prototype.animate = function () {
        // Run smooth param transitions each frame
        if (this.targetParams && Object.keys(this.targetParams).length > 0) {
            this.updateParamTransitions();
        }
        return originalAnimate.call(this);
    };

    // Override updateParamsUI so sliders trigger smooth transitions
    const originalUpdateParamsUI = App.prototype.updateParamsUI;

    App.prototype.updateParamsUI = function () {
        // Let the original method build the UI
        originalUpdateParamsUI.call(this);

        // Rebind slider inputs to use smooth transitions
        const container = document.getElementById('params-container');
        if (!container) return;

        container.querySelectorAll('input[data-param]').forEach(input => {
            const key = input.dataset.param;

            // Remove the old handler by cloning the element
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);

            newInput.addEventListener('input', (e) => {
                const newVal = parseFloat(e.target.value);
                document.getElementById(`val-${key}`).textContent = newVal.toFixed(3);
                this.setParamWithTransition(key, newVal);
            });
        });
    };
})();
