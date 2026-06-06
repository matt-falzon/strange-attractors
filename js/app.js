// Main Application

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
     this.paramAnimation = null; // Parameter animation state
     this.paramAnimSpeed = 0.5; // Animation speed
     this.paramAnimParam = null; // Which parameter to animate
     this.time = 0; // Global time for animations

     this.init();
 }

    init() {
        // Setup WebGL renderer
        this.renderer1 = new PointCloudRenderer(document.getElementById('canvas1'));
        this.renderer2 = new PointCloudRenderer(document.getElementById('canvas2'));

        // Initialize simulation
        this.loadAttractor('lorenz', 1);
        this.loadAttractor('lorenz', 2);

        // Build UI
        this.buildAttractorList();
        this.setupPaletteButtons();
        this.setupControls();
        this.setupAudio();

        // Remove loading screen
        document.getElementById('loading').style.display = 'none';

        // Start animation loop
        this.animate();
    }

    loadAttractor(key, id) {
        if (id === 1) {
            this.currentAttractor1 = key;
            this.simulation1 = new AttractorSimulation(key);
            this.renderer1.setBounds(ATTRACTORS[key].bounds);
            this.simulation1.runBurnIn(5000);
            for (let i = 0; i < 10000; i++) this.simulation1.step();
        } else {
            this.currentAttractor2 = key;
            this.simulation2 = new AttractorSimulation(key);
            this.renderer2.setBounds(ATTRACTORS[key].bounds);
            this.simulation2.runBurnIn(5000);
            for (let i = 0; i < 10000; i++) this.simulation2.step();
        }

        // Run common setup
        this.updateAttractorList();
        this.updateParamsUI();
        this.updateDescription();
        this.updateStats();
        
        document.getElementById('stat-attractor').textContent = ATTRACTORS[key].name;
        this.updateAudio();
    }

    buildAttractorList() {
        const list = document.getElementById('attractor-list');
        list.innerHTML = '';

        Object.keys(ATTRACTORS).forEach(key => {
            const attractor = ATTRACTORS[key];
            const li = document.createElement('li');
            li.className = 'attractor-item';
            li.dataset.key = key;

            // Extract year from discoverer
            const yearMatch = attractor.discoverer.match(/\((\d{4})\)/);
            const year = yearMatch ? yearMatch[1] : '';

            li.innerHTML = `
                <span class="attractor-name">${attractor.name}</span>
                <span class="attractor-year">${year}</span>
            `;

            li.addEventListener('click', () => this.loadAttractor(key));
            list.appendChild(li);
        });
    }

    updateAttractorList() {
        document.querySelectorAll('.attractor-item').forEach(item => {
            item.classList.toggle('active', item.dataset.key === this.currentAttractor);
        });
    }

    updateParamsUI() {
        const container = document.getElementById('params-container');
        container.innerHTML = '';

        const attractor = ATTRACTORS[this.currentAttractor];
        const params = attractor.params;
        const ranges = attractor.ranges;

        // Add reset button
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

            // Add event listener
            const input = group.querySelector('input');
            input.addEventListener('input', (e) => {
                const newVal = parseFloat(e.target.value);
                document.getElementById(`val-${key}`).textContent = newVal.toFixed(3);
                this.simulation.params[key] = newVal;
                this.regenerate();
            });
        });
    }

    resetParams() {
        const attractor = ATTRACTORS[this.currentAttractor];
        this.simulation.params = { ...attractor.defaults };
        this.updateParamsUI();
        this.regenerate();
    }

    // Named presets
    savePreset(name) {
        const presets = this.getPresets();
        presets[name] = {
            attractor: this.currentAttractor,
            params: { ...this.simulation.params }
        };
        localStorage.setItem(`strange-attractors-presets-${this.currentAttractor}`, JSON.stringify(presets));
        this.updatePresetsUI();
    }

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
    }

    deletePreset(name) {
        const presets = this.getPresets();
        delete presets[name];
        localStorage.setItem(`strange-attractors-presets-${this.currentAttractor}`, JSON.stringify(presets));
        this.updatePresetsUI();
    }

    getPresets() {
        const stored = localStorage.getItem(`strange-attractors-presets-${this.currentAttractor}`);
        return stored ? JSON.parse(stored) : {};
    }

    setupPresetsUI() {
      const container = document.getElementById('presets-container');
      if (!container) return;

      const presets = this.getPresets();
      container.innerHTML = '';

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

      // Setup save preset button
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
    }

    updatePresetsUI() {
        this.setupPresetsUI();
    }

    updateDescription() {
        const attractor = ATTRACTORS[this.currentAttractor];
        const desc = document.getElementById('description');
        desc.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 8px; color: rgba(255,255,255,0.8);">
                ${attractor.discoverer}
            </div>
            ${attractor.description}
        `;

        // Update equation display
        const eqPanel = document.getElementById('equation-panel');
        const eqContent = document.getElementById('equation-content');
        if (attractor.equations) {
            eqContent.innerHTML = attractor.equations.map(eq => `<div>${eq}</div>`).join('');
            eqPanel.style.display = 'block';
        } else {
            eqPanel.style.display = 'none';
        }
    }

    screenshot() {
        // Export current view as PNG
        const canvas = this.renderer.canvas;
        const link = document.createElement('a');
        link.download = `strange-attractor-${this.currentAttractor}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    randomAttractor() {
        const keys = Object.keys(ATTRACTORS);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        this.loadAttractor(randomKey);
    }

    applyPreset(presetName) {
        const presets = {
            'lorenz': { sigma: 10, rho: 28, beta: 2.667 },
            'rossler': { a: 0.2, b: 0.2, c: 5.7 },
            'halvorsen': { a: 1.675, b: 1.675, c: 1.675 },
            'Thomas': { b: 0.208186 },
            'david': { a: 0.1, b: 0.1, c: 0.1 },
            'chen': { a: 35, b: 3, c: 28 },
        };

        const preset = presets[this.currentAttractor];
        if (preset) {
            Object.assign(this.simulation.params, preset);
            this.updateParamsUI();
            this.regenerate();
        }
    }

    updateStats() {
        const container = document.getElementById('stats-container');
        const attractor = ATTRACTORS[this.currentAttractor];

        let html = '';
        html += `<div class="stat-row"><span class="stat-label">Equations</span><span class="stat-value">3D ODE</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Parameters</span><span class="stat-value">${Object.keys(attractor.params).length}</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Points</span><span class="stat-value">${this.simulation.points.length.toLocaleString()}</span></div>`;

        container.innerHTML = html;
    }

    setupPaletteButtons() {
        document.querySelectorAll('.palette-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPalette = parseInt(btn.dataset.index);
                this.renderer.setColorPalette(this.currentPalette);
            });
        });
    }

    setupControls() {
        // Point size
        const pointSizeSlider = document.getElementById('point-size');
        pointSizeSlider.addEventListener('input', (e) => {
            this.renderer.pointSize = parseFloat(e.target.value);
            document.getElementById('point-size-value').textContent = parseFloat(e.target.value).toFixed(1);
        });

        // Trail length
        const trailSlider = document.getElementById('trail-length');
        trailSlider.addEventListener('input', (e) => {
            const percent = parseInt(e.target.value);
            this.simulation.maxPoints = Math.round(20000 * percent / 100);
            document.getElementById('trail-value').textContent = percent + '%';
        });

        // Trail toggle (bottom bar)
        document.getElementById('toggle-trails').addEventListener('click', () => {
            this.renderer.showTrails = !this.renderer.showTrails;
            document.getElementById('stat-trails').textContent = this.renderer.showTrails ? 'ON' : 'OFF';
        });

        // Auto-rotate toggle (bottom bar)
        document.getElementById('toggle-rotate').addEventListener('click', () => {
            this.renderer.autoRotate = !this.renderer.autoRotate;
            document.getElementById('stat-rotate').textContent = this.renderer.autoRotate ? 'ON' : 'OFF';
        });

        // Mesh toggle
        document.getElementById('toggle-mesh').addEventListener('click', (e) => {
             const btn = e.target;
             this.renderer.showMesh = !this.renderer.showMesh;
             btn.textContent = this.renderer.showMesh ? 'ON' : 'OFF';
        });

        // Setup bifurcation diagram
        this.setupBifurcation();
        this.setupSymmetryControls();
        this.setupParamAnimation();
        this.setupPresetsUI();
        this.setupHeatmapExplorer();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.isPaused = !this.isPaused;
                document.getElementById('stat-rotate').textContent = this.isPaused ? 'PAUSED' : 'ON';
            }
            if (e.code === 'KeyR') {
                this.renderer.autoRotate = !this.renderer.autoRotate;
                document.getElementById('stat-rotate').textContent = this.renderer.autoRotate ? 'ON' : 'OFF';
            }
            if (e.code === 'KeyT') {
                this.renderer.showTrails = !this.renderer.showTrails;
                document.getElementById('stat-trails').textContent = this.renderer.showTrails ? 'ON' : 'OFF';
            }
            if (e.code === 'KeyB') {
                this.toggleBifurcation();
            }
   
            if (e.code === 'KeyE') {
                const eqPanel = document.getElementById('equation-panel');
                eqPanel.style.display = eqPanel.style.display === 'none' ? 'block' : 'none';
            }
            if (e.code === 'KeyV') {
                this.renderer.toggleVelocityColor();
                document.getElementById('stat-velocity').textContent = this.renderer.showVelocity ? 'ON' : 'OFF';
            }
            if (e.code === 'KeyF') {
                this.paramAnimation = this.paramAnimation ? null : { active: true };
                document.getElementById('stat-animation').textContent = this.paramAnimation ? 'ON' : 'OFF';
            }
            if (e.code === 'KeyY') {
                const modes = [0, 4, 6, 8];
                const current = this.renderer.symmetryOrder;
                const idx = (modes.indexOf(current) + 1) % modes.length;
                this.renderer.setSymmetryMode(modes[idx]);
                document.getElementById('stat-symmetry').textContent = modes[idx] === 0 ? 'OFF' : `${modes[idx]}-way`;
                document.getElementById('symmetry-mode').value = modes[idx];
            }
            if (e.code === 'ArrowLeft') {
                const keys = Object.keys(ATTRACTORS);
                const idx = keys.indexOf(this.currentAttractor);
                const prev = keys[(idx - 1 + keys.length) % keys.length];
                this.loadAttractor(prev);
            }
            if (e.code === 'ArrowRight') {
                const keys = Object.keys(ATTRACTORS);
                const idx = keys.indexOf(this.currentAttractor);
                const next = keys[(idx + 1) % keys.length];
                this.loadAttractor(next);
            }
            if (e.code === 'Home') {
                this.renderer.resetCamera();
            }
        });
    }
    setupSymmetryControls() {
        // Symmetry mode selector
        const symmetrySelect = document.getElementById('symmetry-mode');
        if (symmetrySelect) {
            symmetrySelect.addEventListener('change', (e) => {
                const order = parseInt(e.target.value);
                this.renderer.setSymmetryMode(order);
                document.getElementById('stat-symmetry').textContent = order === 0 ? 'OFF' : `${order}-way`;
            });
        }

        // Velocity color toggle
        const velocityToggle = document.getElementById('toggle-velocity');
        if (velocityToggle) {
            velocityToggle.addEventListener('click', () => {
                this.renderer.toggleVelocityColor();
                document.getElementById('stat-velocity').textContent = this.renderer.showVelocity ? 'ON' : 'OFF';
            });
        }
    }

    setupParamAnimation() {
        const animParamSelect = document.getElementById('anim-param');
        const animSpeedSlider = document.getElementById('anim-speed');
        const animToggle = document.getElementById('toggle-animation');

        if (animParamSelect) {
            // Populate with current attractor's parameters
            const attractor = ATTRACTORS[this.currentAttractor];
            animParamSelect.innerHTML = '';
            Object.keys(attractor.ranges).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                animParamSelect.appendChild(option);
            });

            animParamSelect.addEventListener('change', (e) => {
                this.paramAnimParam = e.target.value;
            });
        }

        if (animSpeedSlider) {
            animSpeedSlider.addEventListener('input', (e) => {
                this.paramAnimSpeed = parseFloat(e.target.value);
                document.getElementById('anim-speed-value').textContent = this.paramAnimSpeed.toFixed(2);
            });
        }

        if (animToggle) {
            animToggle.addEventListener('click', () => {
                this.paramAnimation = this.paramAnimation ? null : { active: true };
                document.getElementById('stat-animation').textContent = this.paramAnimation ? 'ON' : 'OFF';
            });
        }
    }

    updateParamAnimation() {
        if (!this.paramAnimation || !this.paramAnimParam) return;

        const attractor = ATTRACTORS[this.currentAttractor];
        const [min, max] = attractor.ranges[this.paramAnimParam];
        const range = max - min;

        // Smooth oscillation using sine wave
        this.time += this.paramAnimSpeed * 0.01;
        const animValue = min + (Math.sin(this.time) + 1) / 2 * range;

        this.simulation.params[this.paramAnimParam] = animValue;

        // Update UI
        const valueEl = document.getElementById(`val-${this.paramAnimParam}`);
        const sliderEl = document.querySelector(`input[data-param="${this.paramAnimParam}"]`);
        if (valueEl) valueEl.textContent = animValue.toFixed(3);
        if (sliderEl) sliderEl.value = animValue;
    }

    setupAudio() {
        // Audio toggle (bottom bar)
        const toggleAudio = document.getElementById('toggle-audio');
        if (toggleAudio) {
            toggleAudio.addEventListener('click', () => {
                const wasEnabled = window.audioEngine.enabled;
                window.audioEngine.toggle();
                const isEnabled = window.audioEngine.enabled;
                document.getElementById('stat-audio').textContent = isEnabled ? 'ON' : 'OFF';
                document.getElementById('stat-audio').style.color = isEnabled ? '#64b5f6' : '';

                // Show/hide audio panel
                const panel = document.getElementById('audio-panel');
                panel.style.display = isEnabled ? 'block' : 'none';

                // Update signature display
                this.updateAudioSignature();
            });
        }

        // Volume slider
        const volumeSlider = document.getElementById('audio-volume');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value) / 100;
                window.audioEngine.setVolume(vol);
                document.getElementById('audio-volume-value').textContent = `${Math.round(vol * 100)}%`;
            });
        }

        // Set initial volume
        window.audioEngine.setVolume(0.3);
    }

    updateAudio() {
        // Notify audio engine of the current attractor and simulation state
        window.audioEngine.setAttractor(this.currentAttractor, this.simulation);
        this.updateAudioSignature();
    }

    updateAudioSignature() {
        const sig = window.audioEngine.signatures[this.currentAttractor] || window.audioEngine.defaultSignature;
        const el = document.getElementById('audio-signature');
        if (el) {
            el.textContent = `${sig.type.toUpperCase()} • ${sig.description}`;
        }
    }

    updateAudioDisplay() {
        // Update live audio state display in the audio panel
        const state = window.audioEngine.getState();
        const freqEl = document.getElementById('audio-freq-value');
        const ampEl = document.getElementById('audio-amp-value');
        if (freqEl) freqEl.textContent = `${Math.round(state.frequency)} Hz`;
        if (ampEl) ampEl.textContent = state.amplitude.toFixed(3);
    }

    setupBifurcation() {
        // Populate parameter selector
        const attractor = ATTRACTORS[this.currentAttractor];
        const select = document.getElementById('bifurcation-param');
        select.innerHTML = '';
        Object.keys(attractor.ranges).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key;
            select.appendChild(option);
        });
        select.value = Object.keys(attractor.ranges)[0];

        // Close button
        document.getElementById('bifurcation-close').addEventListener('click', () => {
            this.toggleBifurcation();
        });

        // Generate button
        document.getElementById('bifurcation-generate').addEventListener('click', () => {
            this.generateBifurcation();
        });

        // Update on param change
        select.addEventListener('change', () => {
            const ranges = ATTRACTORS[this.currentAttractor].ranges;
            const [min, max] = ranges[select.value] || [0, 1];
            document.getElementById('bifurcation-min').value = min;
            document.getElementById('bifurcation-max').value = max;
            document.getElementById('bifurcation-subtitle').textContent =
                `Varying parameter ${select.value} from ${min} to ${max}`;
        });
    }

    toggleBifurcation() {
        const overlay = document.getElementById('bifurcation-overlay');
        const isVisible = overlay.style.display !== 'none';

        if (isVisible) {
            overlay.style.display = 'none';
        } else {
            overlay.style.display = 'flex';
            this.isBifurcationVisible = true;
            this.setupBifurcation();
            this.generateBifurcation();
        }
    }

    generateBifurcation() {
        const canvas = document.getElementById('bifurcation-canvas');
        canvas.width = Math.min(800, window.innerWidth - 100);
        canvas.height = Math.min(500, window.innerHeight - 300);
        const ctx = canvas.getContext('2d');

        const paramKey = document.getElementById('bifurcation-param').value;
        const paramMin = parseFloat(document.getElementById('bifurcation-min').value);
        const paramMax = parseFloat(document.getElementById('bifurcation-max').value);
        const numSteps = parseInt(document.getElementById('bifurcation-steps').value);

        document.getElementById('bifurcation-subtitle').textContent =
            `Varying parameter ${paramKey} from ${paramMin.toFixed(1)} to ${paramMax.toFixed(1)}`;

        // Clear canvas
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Generate bifurcation diagram
        const stepSize = (paramMax - paramMin) / numSteps;
        const burnIn = 200;
        const plotPoints = 100;

        let stepIndex = 0;
        const generateBatch = () => {
            const batchSize = 5;
            for (let b = 0; b < batchSize && stepIndex < numSteps; b++, stepIndex++) {
                const paramValue = paramMin + stepIndex * stepSize;
                const x = (stepIndex / numSteps) * canvas.width;

                // Create temporary simulation with modified parameter
                const tempSim = new AttractorSimulation(this.currentAttractor);
                tempSim.params[paramKey] = paramValue;

                // Burn-in
                for (let i = 0; i < burnIn; i++) {
                    tempSim.step();
                }

                // Plot points
                for (let i = 0; i < plotPoints; i++) {
                    tempSim.step();
                    const point = tempSim.position;
                    const yNorm = (point[1] + 20) / 60;
                    const y = canvas.height - yNorm * canvas.height;

                    const hue = (stepIndex / numSteps) * 240;
                    ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.3)`;
                    ctx.fillRect(x, y, 1, 1);
                }
            }

            if (stepIndex < numSteps) {
                requestAnimationFrame(generateBatch);
            } else {
                // Draw axis labels
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '10px SF Mono, monospace';
                ctx.fillText(`${paramMin.toFixed(1)}`, 5, canvas.height - 5);
                ctx.fillText(`${paramMax.toFixed(1)}`, canvas.width - 40, canvas.height - 5);
                ctx.fillText(`x`, canvas.width - 15, canvas.height / 2);
            }
        };

        generateBatch();
    }

    regenerate() {
        this.simulation.reset();
        this.simulation.runBurnIn(5000);
        for (let i = 0; i < 10000; i++) {
            this.simulation.step();
        }
    }

    // Smooth parameter transitions
    setParamSmooth(key, target, duration = 500) {
        const current = this.simulation.params[key];
        const start = performance.now();
        const attractor = ATTRACTORS[this.currentAttractor];
        const [min, max] = attractor.ranges[key] || [0, 1];
        target = Math.max(min, Math.min(max, target));

        const animate = (now) => {
            const t = Math.min((now - start) / duration, 1);
            // Ease in-out cubic
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

    // 2D Parameter space exploration - heatmap
    generateParamHeatmap(paramA, paramB) {
        const container = document.getElementById('heatmap-container');
        if (!container) return;

        const attractor = ATTRACTORS[this.currentAttractor];
        const [minA, maxA] = attractor.ranges[paramA];
        const [minB, maxB] = attractor.ranges[paramB];

        container.innerHTML = `
            <div class="heatmap-header">
                <span class="param-name">2D Parameter Space: ${paramA} × ${paramB}</span>
                <button id="close-heatmap" style="background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;font-size:16px;">×</button>
            </div>
            <canvas id="heatmap-canvas" width="400" height="300" style="width:100%;border-radius:8px;border:1px solid rgba(255,255,255,0.1);"></canvas>
            <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:8px;">
                Color indicates trajectory stability (blue=stable, red=chaotic)
            </div>
        `;
        container.style.display = 'block';

        document.getElementById('close-heatmap').addEventListener('click', () => {
            container.style.display = 'none';
            container.innerHTML = '';
        });

        const canvas = document.getElementById('heatmap-canvas');
        const ctx = canvas.getContext('2d');
        const resolution = 40;
        const cellW = canvas.width / resolution;
        const cellH = canvas.height / resolution;

        let cell = 0;
        const total = resolution * resolution;

        const drawBatch = () => {
            const batchSize = 20;
            for (let b = 0; b < batchSize && cell < total; b++, cell++) {
                const col = cell % resolution;
                const row = Math.floor(cell / resolution);

                const valA = minA + (col / (resolution - 1)) * (maxA - minA);
                const valB = minB + (row / (resolution - 1)) * (maxB - minB);

                // Quick simulation to determine stability
                const sim = new AttractorSimulation(this.currentAttractor);
                sim.params[paramA] = valA;
                sim.params[paramB] = valB;

                let diverged = false;
                for (let i = 0; i < 200; i++) {
                    sim.step();
                    const [x, y, z] = sim.position;
                    if (Math.abs(x) > 1000 || Math.abs(y) > 1000 || Math.abs(z) > 1000) {
                        diverged = true;
                        break;
                    }
                }

                // Calculate a stability metric based on trajectory bounds
                const bounds = attractor.bounds;
                const inBounds = Math.abs(sim.position[0]) < (bounds[1] - bounds[0]) * 2 &&
                                 Math.abs(sim.position[1]) < (bounds[3] - bounds[2]) * 2;

                // Color: blue (stable) -> yellow (moderate) -> red (chaotic/diverged)
                let hue;
                if (diverged) {
                    hue = 0; // Red for diverged
                } else if (inBounds) {
                    hue = 240; // Blue for stable
                } else {
                    hue = 60; // Yellow for moderate
                }

                ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.8)`;
                ctx.fillRect(col * cellW, row * cellH, cellW + 1, cellH + 1);
            }

            // Draw labels
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '10px SF Mono, monospace';
            ctx.fillText(`${minA.toFixed(1)}`, 5, canvas.height - 5);
            ctx.fillText(`${maxA.toFixed(1)}`, canvas.width - 40, canvas.height - 5);
            ctx.fillText(`${paramA} →`, canvas.width / 2 - 20, canvas.height - 5);

            ctx.save();
            ctx.translate(10, 10);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(`${minB.toFixed(1)}`, 0, 0);
            ctx.fillText(`${maxB.toFixed(1)}`, 0, -canvas.height + 20);
            ctx.fillText(`${paramB} →`, 0, -canvas.height / 2);
            ctx.restore();

            if (cell < total) {
                requestAnimationFrame(drawBatch);
            }
        };

        drawBatch();
    }

    setupHeatmapExplorer() {
        const toggleBtn = document.getElementById('toggle-heatmap');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            const attractor = ATTRACTORS[this.currentAttractor];
            const paramKeys = Object.keys(attractor.ranges);
            if (paramKeys.length < 2) return;

            // Use first two parameters for the heatmap
            this.generateParamHeatmap(paramKeys[0], paramKeys[1]);
        });
    }

     animate() {
        // Ensure simulation exists
        if (!this.simulation1 || !this.simulation2) return;

        // Add new points
        if (!this.isPaused) {
            for (let i = 0; i < 10; i++) {
                this.simulation1.stepLyapunov();
                this.simulation2.stepLyapunov();
            }
        }

        // Update renderers
        this.renderer1.updatePoints(this.simulation1.points);
        this.renderer1.render();
        this.renderer2.updatePoints(this.simulation2.points);
        this.renderer2.render();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updatePhaseSpace() {
        const points = this.simulation.points;
        if (!points || points.length === 0) return;

        // Calculate bounds
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
            const w = canvas.width;
            const h = canvas.height;

            // Clear with semi-transparent overlay for trail effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, w, h);

            // Get recent points (last 500)
            const recent = points.slice(-500);
            const rangeA = (axisA === 0) ? (maxX - minX) : (axisA === 1) ? (maxY - minY) : (maxZ - minZ);
            const rangeB = (axisB === 0) ? (maxX - minX) : (axisB === 1) ? (maxY - minY) : (maxZ - minZ);
            const minA = (axisA === 0) ? minX : (axisA === 1) ? minY : minZ;
            const minB = (axisB === 0) ? minX : (axisB === 1) ? minY : minZ;

            const maxRange = Math.max(rangeA, rangeB);
            const padding = 5;

            ctx.lineWidth = 0.5;
            for (let i = 1; i < recent.length; i++) {
                const p1 = recent[i - 1];
                const p2 = recent[i];

                const x1 = padding + ((p1[axisA] - minA) / rangeA) * (w - 2 * padding);
                const y1 = h - padding - ((p1[axisB] - minB) / rangeB) * (h - 2 * padding);
                const x2 = padding + ((p2[axisA] - minA) / rangeA) * (w - 2 * padding);
                const y2 = h - padding - ((p2[axisB] - minB) / rangeB) * (h - 2 * padding);

                const t = i / recent.length;
                const hue = t * 240;
                ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        };

        // XY plane
        renderPhase2D('phase-xy', 0, 1);
        // XZ plane
        renderPhase2D('phase-xz', 0, 2);
        // YZ plane
        renderPhase2D('phase-yz', 1, 2);
    }
}

// Start app when DOM is ready
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

// Global error handler
window.addEventListener('error', (e) => {
    const errorEl = document.getElementById('error');
    if (errorEl) {
        errorEl.textContent = `Error: ${e.message}\n${e.filename}:${e.lineno}`;
        errorEl.style.display = 'block';
    }
});
