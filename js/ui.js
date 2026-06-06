// App UI methods - display and panel updates
// Extends App.prototype (loaded after app.js)

Object.assign(App.prototype, {

    buildAttractorList() {
        const list = document.getElementById('attractor-list');
        list.innerHTML = '';

        Object.keys(ATTRACTORS).forEach(key => {
            const attractor = ATTRACTORS[key];
            const li = document.createElement('li');
            li.className = 'attractor-item';
            li.dataset.key = key;

            const yearMatch = attractor.discoverer.match(/\((\d{4})\)/);
            const year = yearMatch ? yearMatch[1] : '';

            li.innerHTML = `
                <span class="attractor-name">${attractor.name}</span>
                <span class="attractor-year">${year}</span>
            `;

            li.addEventListener('click', () => this.loadAttractor(key));
            list.appendChild(li);
        });
    },

    updateAttractorList() {
        document.querySelectorAll('.attractor-item').forEach(item => {
            item.classList.toggle('active', item.dataset.key === this.currentAttractor);
        });
    },

    updateParamsUI() {
        const container = document.getElementById('params-container');
        container.innerHTML = '';

        const attractor = ATTRACTORS[this.currentAttractor];
        const params = attractor.params;
        const ranges = attractor.ranges;

        const resetBtn = document.createElement('button');
        resetBtn.id = 'reset-params';
        resetBtn.className = 'param-reset-btn';
        resetBtn.textContent = '↺ Reset to Defaults';
        resetBtn.addEventListener('click', () => this.resetParams());
        container.appendChild(resetBtn);

        Object.keys(params).forEach(key => {
            const group = document.createElement('div');
            group.className = 'param-group';

            const [min, max] = ranges[key] || [0, 1];
            const value = params[key];

            group.innerHTML = `
                <div class="param-label">
                    <span class="param-name">${key}</span>
                    <span class="param-value" id="val-${key}">${value.toFixed(3)}</span>
                </div>
                <input type="range" min="${min}" max="${max}" step="${(max - min) / 200}" value="${value}" data-param="${key}">
            `;

            container.appendChild(group);

            const input = group.querySelector('input');
            input.addEventListener('input', (e) => {
                const newVal = parseFloat(e.target.value);
                document.getElementById(`val-${key}`).textContent = newVal.toFixed(3);
                this.simulation.params[key] = newVal;
                this.regenerate();
            });
        });
    },

    resetParams() {
        const attractor = ATTRACTORS[this.currentAttractor];
        this.simulation.params = { ...attractor.defaults };
        this.updateParamsUI();
        this.regenerate();
    },

    savePreset(name) {
        const presets = this.getPresets();
        presets[name] = {
            attractor: this.currentAttractor,
            params: { ...this.simulation.params }
        };
        localStorage.setItem(`strange-attractors-presets-${this.currentAttractor}`, JSON.stringify(presets));
        this.updatePresetsUI();
    },

    loadPreset(name) {
        const presets = this.getPresets();
        const preset = presets[name];
        if (!preset) return;

        if (preset.attractor !== this.currentAttractor) {
            this.loadAttractor(preset.attractor);
        }

        this.simulation.params = { ...preset.params };
        this.updateParamsUI();
        this.regenerate();
    },

    deletePreset(name) {
        const presets = this.getPresets();
        delete presets[name];
        localStorage.setItem(`strange-attractors-presets-${this.currentAttractor}`, JSON.stringify(presets));
        this.updatePresetsUI();
    },

    getPresets() {
        const stored = localStorage.getItem(`strange-attractors-presets-${this.currentAttractor}`);
        return stored ? JSON.parse(stored) : {};
    },

    setupPresetsUI() {
        const container = document.getElementById('presets-container');
        if (!container) return;

        container.innerHTML = '';
        const presets = this.getPresets();

        Object.keys(presets).forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = name;
            btn.addEventListener('click', () => this.loadPreset(name));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'preset-delete';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePreset(name);
            });

            const wrapper = document.createElement('div');
            wrapper.className = 'preset-item';
            wrapper.appendChild(btn);
            wrapper.appendChild(deleteBtn);
            container.appendChild(wrapper);
        });

        const saveBtn = document.getElementById('save-preset');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const nameInput = document.getElementById('preset-name');
                const name = nameInput.value.trim();
                if (name) {
                    this.savePreset(name);
                    nameInput.value = '';
                }
            });
        }
    },

    updatePresetsUI() {
        this.setupPresetsUI();
    },

    applyPreset(presetName) {
        const presets = {
            'lorenz':    { sigma: 10, rho: 28, beta: 2.667 },
            'rossler':   { a: 0.2, b: 0.2, c: 5.7 },
            'halvorsen': { a: 1.675, b: 1.675, c: 1.675 },
            'Thomas':    { b: 0.208186 },
            'david':     { a: 0.1, b: 0.1, c: 0.1 },
            'chen':      { a: 35, b: 3, c: 28 },
        };

        const preset = presets[this.currentAttractor];
        if (preset) {
            Object.assign(this.simulation.params, preset);
            this.updateParamsUI();
            this.regenerate();
        }
    },

    updateDescription() {
        const attractor = ATTRACTORS[this.currentAttractor];
        const desc = document.getElementById('description');
        desc.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px; color: rgba(255,255,255,0.8);">
                ${attractor.discoverer}
            </div>
            ${attractor.description}
        `;

        const eqPanel = document.getElementById('equation-panel');
        const eqContent = document.getElementById('equation-content');
        if (attractor.equations) {
            eqContent.innerHTML = attractor.equations.map(eq => `<div>${eq}</div>`).join('');
            eqPanel.style.display = 'block';
        } else {
            eqPanel.style.display = 'none';
        }
    },

    updateStats() {
        const container = document.getElementById('stats-container');
        const attractor = ATTRACTORS[this.currentAttractor];

        let html = '';
        html += `<div class="stat-row"><span class="stat-label">Equations</span><span class="stat-value">3D ODE</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Parameters</span><span class="stat-value">${Object.keys(attractor.params).length}</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Points</span><span class="stat-value">${this.simulation.points.length.toLocaleString()}</span></div>`;

        container.innerHTML = html;
    },

    updateAudio() {
        window.audioEngine.setAttractor(this.currentAttractor, this.simulation);
        this.updateAudioSignature();
    },

    updateAudioSignature() {
        const sig = window.audioEngine.signatures[this.currentAttractor] || window.audioEngine.defaultSignature;
        const el = document.getElementById('audio-signature');
        if (el) {
            el.textContent = `${sig.type.toUpperCase()} • ${sig.description}`;
        }
    },

    updateAudioDisplay() {
        const state = window.audioEngine.getState();
        const freqEl = document.getElementById('audio-freq-value');
        const ampEl  = document.getElementById('audio-amp-value');
        if (freqEl) freqEl.textContent = `${Math.round(state.frequency)} Hz`;
        if (ampEl)  ampEl.textContent  = state.amplitude.toFixed(3);
    },

    updatePhaseSpace() {
        const points = this.simulation.points;
        if (!points || points.length === 0) return;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (const p of points) {
            if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
            if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
            if (p[2] < minZ) minZ = p[2]; if (p[2] > maxZ) maxZ = p[2];
        }

        const renderPhase2D = (canvasId, axisA, axisB) => {
            const canvas = document.getElementById(canvasId);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const w = canvas.width, h = canvas.height;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, w, h);

            const recent = points.slice(-500);
            const rangeA = (axisA === 0) ? (maxX-minX) : (axisA === 1) ? (maxY-minY) : (maxZ-minZ);
            const rangeB = (axisB === 0) ? (maxX-minX) : (axisB === 1) ? (maxY-minY) : (maxZ-minZ);
            const minA   = (axisA === 0) ? minX : (axisA === 1) ? minY : minZ;
            const minB   = (axisB === 0) ? minX : (axisB === 1) ? minY : minZ;
            const padding = 5;

            ctx.lineWidth = 0.5;
            for (let i = 1; i < recent.length; i++) {
                const p1 = recent[i-1], p2 = recent[i];
                const x1 = padding + ((p1[axisA]-minA)/rangeA) * (w-2*padding);
                const y1 = h - padding - ((p1[axisB]-minB)/rangeB) * (h-2*padding);
                const x2 = padding + ((p2[axisA]-minA)/rangeA) * (w-2*padding);
                const y2 = h - padding - ((p2[axisB]-minB)/rangeB) * (h-2*padding);

                const t = i / recent.length;
                ctx.strokeStyle = `hsla(${t*240}, 70%, 60%, 0.8)`;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        };

        renderPhase2D('phase-xy', 0, 1);
        renderPhase2D('phase-xz', 0, 2);
        renderPhase2D('phase-yz', 1, 2);
    }

});
