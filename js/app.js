// Main Application - core lifecycle only
// UI methods: ui.js   Controls/setup: controls.js

class App {
    constructor() {
        this.currentAttractor = 'lorenz';
        this.simulation = null;
        this.renderer = null;
        this.animationId = null;
        this.fps = 60;
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.currentPalette = 0;
        this.isPaused = false;
        this.paramAnimation = null;
        this.paramAnimSpeed = 0.5;
        this.paramAnimParam = null;
        this.time = 0;
        this.targetParams = {};
        this.transitionLerpSpeed = 0.08;

        this.init();
    }

    init() {
        this.renderer1 = new PointCloudRenderer(document.getElementById('canvas1'));
        this.renderer2 = new PointCloudRenderer(document.getElementById('canvas2'));

        this.loadAttractor('lorenz', 1);
        this.loadAttractor('lorenz', 2);

        this.buildAttractorList();
        this.setupPaletteButtons();
        this.setupControls();
        this.setupAudio();

        this.loadScript('js/param-editor.js');

        document.getElementById('loading').style.display = 'none';

        this.animate();
    }

    loadAttractor(key, id = 1) {
        if (id === 1) {
            this.currentAttractor1 = key;
            this.simulation1 = new AttractorSimulation(key);
            this.renderer1.setBounds(ATTRACTORS[key].bounds);
            this.simulation1.runBurnIn(5000);
            for (let i = 0; i < 10000; i++) this.simulation1.step();
            this.currentAttractor = key;
            this.simulation = this.simulation1;
            this.renderer = this.renderer1;
        } else {
            this.currentAttractor2 = key;
            this.simulation2 = new AttractorSimulation(key);
            this.renderer2.setBounds(ATTRACTORS[key].bounds);
            this.simulation2.runBurnIn(5000);
            for (let i = 0; i < 10000; i++) this.simulation2.step();
        }

        this.updateAttractorList();
        this.updateParamsUI();
        this.updateDescription();
        this.updateStats();

        document.getElementById('stat-attractor').textContent = ATTRACTORS[key].name;
        this.updateAudio();
    }

    animate() {
        if (!this.simulation1 || !this.simulation2) return;

        if (!this.isPaused) {
            for (let i = 0; i < 10; i++) {
                this.simulation1.stepLyapunov();
                this.simulation2.stepLyapunov();
            }
            this.updateParamAnimation();
            this.updateParamTransitions();
        }

        this.renderer1.updatePoints(this.simulation1.points);
        this.renderer1.render();
        this.renderer2.updatePoints(this.simulation2.points);
        this.renderer2.render();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    regenerate() {
        this.simulation.reset();
        this.simulation.runBurnIn(5000);
        for (let i = 0; i < 10000; i++) {
            this.simulation.step();
        }
    }

    screenshot() {
        const canvas = this.renderer.canvas;
        const link = document.createElement('a');
        link.download = `strange-attractor-${this.currentAttractor}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    randomAttractor() {
        const keys = Object.keys(ATTRACTORS);
        this.loadAttractor(keys[Math.floor(Math.random() * keys.length)]);
    }

    setParamSmooth(key, target, duration = 500) {
        const current = this.simulation.params[key];
        const start = performance.now();
        const attractor = ATTRACTORS[this.currentAttractor];
        const [min, max] = attractor.ranges[key] || [0, 1];
        target = Math.max(min, Math.min(max, target));

        const animate = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;
            const value = current + (target - current) * ease;
            this.simulation.params[key] = value;

            const valEl = document.getElementById(`val-${key}`);
            if (valEl) valEl.textContent = value.toFixed(3);
            const sliderEl = document.querySelector(`input[data-param="${key}"]`);
            if (sliderEl) sliderEl.value = value;

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.regenerate();
            }
        };
        requestAnimationFrame(animate);
    }

    loadScript(src) {
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.async = false;
        document.head.appendChild(script);
    }

    updateParamTransitions() {
        const speed = this.transitionLerpSpeed;
        const current = this.simulation.params;
        for (const key in this.targetParams) {
            if (key in current) {
                const diff = this.targetParams[key] - current[key];
                if (Math.abs(diff) > 0.0001) {
                    current[key] += diff * speed;
                } else {
                    current[key] = this.targetParams[key];
                    delete this.targetParams[key];
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new App();
    } catch (e) {
        console.error('App initialization failed:', e);
        const errorEl = document.getElementById('error');
        errorEl.textContent = 'Error: ' + e.message;
        errorEl.style.display = 'block';
        document.getElementById('loading').style.display = 'none';
    }
});

window.addEventListener('error', (e) => {
    const errorEl = document.getElementById('error');
    if (errorEl) {
        errorEl.textContent = `Error: ${e.message}\n${e.filename}:${e.lineno}`;
        errorEl.style.display = 'block';
    }
});
