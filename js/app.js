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
        const canvas = document.getElementById('canvas');
        this.renderer = new PointCloudRenderer(canvas);

        // Initialize simulation
        this.loadAttractor('lorenz');

        // Build UI
        this.buildAttractorList();
        this.setupPaletteButtons();
        this.setupControls();

        // Remove loading screen
        document.getElementById('loading').style.display = 'none';

        // Start animation loop
        this.animate();
    }

    loadAttractor(key) {
        this.currentAttractor = key;
        const attractor = ATTRACTORS[key];

        // Create simulation
        this.simulation = new AttractorSimulation(key);

        // Update renderer bounds
        this.renderer.setBounds(attractor.bounds);

        // Run burn-in to skip transient phase
        this.simulation.runBurnIn(5000);

        // Generate initial points
        for (let i = 0; i < 10000; i++) {
            this.simulation.step();
        }

        // Update UI
        this.updateAttractorList();
        this.updateParamsUI();
        this.updateDescription();
        this.updateStats();

        // Update bottom bar
        document.getElementById('stat-attractor').textContent = attractor.name;
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

        // Setup bifurcation diagram
        this.setupBifurcation();
        this.setupSymmetryControls();
        this.setupParamAnimation();

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
            if (e.code === 'KeyS') {
                e.preventDefault();
                this.screenshot();
            }
            if (e.code === 'KeyE') {
                const eqPanel = document.getElementById('equation-panel');
                eqPanel.style.display = eqPanel.style.display === 'none' ? 'block' : 'none';
            }
            if (e.code === 'KeyV') {
                this.renderer.toggleVelocityColor();
                document.getElementById('stat-velocity').textContent = this.renderer.showVelocity ? 'ON' : 'OFF';
            }
            if (e.code === 'KeyA') {
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

     animate() {
        // Add new points for live animation with Lyapunov tracking
        if (!this.isPaused) {
            for (let i = 0; i < 10; i++) {
                this.simulation.stepLyapunov();
            }
            this.updateParamAnimation();
        }

        // Update renderer
        this.renderer.updatePoints(this.simulation.points);
        this.renderer.render();

        // Update phase space views
        this.updatePhaseSpace();

        // Update FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;

            // Update stats
            document.getElementById('stat-points').textContent = this.simulation.points.length.toLocaleString();
            document.getElementById('stat-fps').textContent = this.fps;

            // Update Lyapunov exponent display
            const lyap = this.simulation.getMaxLyapunovExponent();
            const lyapEl = document.getElementById('stat-lyapunov');
            if (lyapEl) {
                lyapEl.textContent = lyap.toFixed(3);
                lyapEl.style.color = lyap > 0 ? '#ff6b6b' : lyap < 0 ? '#6bff6b' : '#ffff6b';
            }
            const lyapStatus = document.getElementById('stat-chaos');
            if (lyapStatus) {
                lyapStatus.textContent = lyap > 0.01 ? 'CHAOTIC' : lyap < -0.01 ? 'STABLE' : 'EDGE';
                lyapStatus.style.color = lyap > 0.01 ? '#ff6b6b' : lyap < -0.01 ? '#6bff6b' : '#ffff6b';
            }
        }

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
