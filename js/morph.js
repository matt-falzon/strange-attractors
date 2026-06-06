// Attractor morphing - smooth crossfade between attractors
// Extends App.prototype (loaded after app.js)

// Override animate() to inject morph update into the main render loop
const _origAnimate = App.prototype.animate;
App.prototype.animate = function () {
    this.updateMorph();
    _origAnimate.call(this);
};

Object.assign(App.prototype, {

    morph() {
        // Cancel any in-progress morph
        if (this.morphState) {
            this.morphState = null;
        }

        const keys = Object.keys(ATTRACTORS);
        const idx = keys.indexOf(this.currentAttractor);
        const nextIdx = (idx + 1) % keys.length;
        const targetKey = keys[nextIdx];

        const currentAttractor = ATTRACTORS[this.currentAttractor];
        const targetAttractor = ATTRACTORS[targetKey];

        // Collect all param keys from both attractors
        const allKeys = [...new Set([
            ...Object.keys(currentAttractor.params),
            ...Object.keys(targetAttractor.params),
        ])];

        // Build from/to param maps, defaulting missing params to 0
        const fromParams = {};
        const toParams = {};
        for (const key of allKeys) {
            fromParams[key] = currentAttractor.params[key] !== undefined
                ? currentAttractor.params[key] : 0;
            toParams[key] = targetAttractor.params[key] !== undefined
                ? targetAttractor.params[key] : 0;
        }

        // Store morph state
        this.morphState = {
            fromKey: this.currentAttractor,
            toKey: targetKey,
            fromParams: fromParams,
            toParams: toParams,
            allKeys: allKeys,
            startTime: performance.now(),
            duration: 2000,
        };

        // Reset simulation to target attractor initial conditions
        this.simulation.position = [...targetAttractor.init];
        this.simulation.attractor = targetAttractor;
        this.simulation.key = targetKey;
        this.currentAttractor = targetKey;

        // Dissolve existing point cloud
        if (this.simulation.points.length > 0) {
            const keepCount = Math.floor(this.simulation.points.length * 0.1);
            this.simulation.points = this.simulation.points.slice(-keepCount);
        }

        document.getElementById('stat-attractor').textContent = targetAttractor.name;
        this.updateAttractorList();
        this.updateDescription();
        this.updateParamsUI();
    },

    updateMorph() {
        if (!this.morphState) return;

        const state = this.morphState;
        const elapsed = performance.now() - state.startTime;
        const raw = Math.min(elapsed / state.duration, 1);

        // Ease-in-out cubic interpolation
        const t = raw < 0.5
            ? 4 * raw * raw * raw
            : 1 - Math.pow(-2 * raw + 2, 3) / 2;

        // Interpolate all params
        for (const key of state.allKeys) {
            const fromVal = state.fromParams[key];
            const toVal = state.toParams[key];
            this.simulation.params[key] = fromVal + (toVal - fromVal) * t;
        }

        // Update param display values
        for (const key of state.allKeys) {
            const val = this.simulation.params[key];
            const valEl = document.getElementById(`val-${key}`);
            if (valEl) valEl.textContent = val.toFixed(3);
            const sliderEl = document.querySelector(`input[data-param="${key}"]`);
            if (sliderEl) sliderEl.value = val;
        }

        // Dissolve point cloud in second half of morph
        if (raw > 0.5) {
            const dissolveProgress = (raw - 0.5) * 2; // 0..1 in second half
            const maxPts = this.simulation.maxPoints;
            const targetLen = Math.floor(maxPts * (1 - dissolveProgress * 0.5));
            if (this.simulation.points.length > targetLen) {
                this.simulation.points.length = targetLen;
            }
        }

        // Morph complete - finalize
        if (raw >= 1) {
            const targetAttractor = ATTRACTORS[state.toKey];
            this.simulation.params = { ...targetAttractor.params };
            this.simulation.attractor = targetAttractor;
            this.simulation.key = state.toKey;
            this.renderer.setBounds(targetAttractor.bounds);

            // Clear for fresh attractor shape
            this.simulation.points.length = 0;
            this.simulation.position = [...targetAttractor.init];

            this.morphState = null;
            this.updateParamsUI();
        }
    },
});
