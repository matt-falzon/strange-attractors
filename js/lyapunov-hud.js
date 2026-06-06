// Lyapunov HUD - chaos indicator display
// Extends App.prototype (loaded after app.js)

Object.assign(App.prototype, {

    updateLyapunovDisplay() {
        // Throttle to ~1Hz (once every ~60 frames at 60fps)
        if (!this._lyapLastUpdate) this._lyapLastUpdate = 0;
        const now = performance.now();
        if (now - this._lyapLastUpdate < 1000) return;
        this._lyapLastUpdate = now;

        const lyap = this.simulation.getMaxLyapunovExponent();
        if (lyap === 0) return; // no data yet

        // Update Lyapunov value display
        const lyapEl = document.getElementById('stat-lyapunov');
        if (lyapEl) {
            lyapEl.textContent = lyap.toFixed(3);
        }

        // Update chaos indicator with color coding
        const chaosEl = document.getElementById('stat-chaos');
        if (chaosEl) {
            const threshold = 0.01; // near-zero band for CRITICAL
            if (lyap > threshold) {
                chaosEl.textContent = 'CHAOTIC';
                chaosEl.style.color = '#ff5555';
            } else if (lyap < -threshold) {
                chaosEl.textContent = 'STABLE';
                chaosEl.style.color = '#55ff55';
            } else {
                chaosEl.textContent = 'CRITICAL';
                chaosEl.style.color = '#ffff55';
            }
        }
    }

});
