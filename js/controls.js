// App controls - event setup, param animation, bifurcation, heatmap
// Extends App.prototype (loaded after app.js)

Object.assign(App.prototype, {

    setupPaletteButtons() {
        document.querySelectorAll('.palette-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPalette = parseInt(btn.dataset.index);
                this.renderer.setColorPalette(this.currentPalette);
            });
        });
    },

    setupControls() {
        const pointSizeSlider = document.getElementById('point-size');
        pointSizeSlider.addEventListener('input', (e) => {
            this.renderer.pointSize = parseFloat(e.target.value);
            document.getElementById('point-size-value').textContent = parseFloat(e.target.value).toFixed(1);
        });

        const trailSlider = document.getElementById('trail-length');
        trailSlider.addEventListener('input', (e) => {
            const percent = parseInt(e.target.value);
            this.simulation.maxPoints = Math.round(20000 * percent / 100);
            document.getElementById('trail-value').textContent = percent + '%';
        });

        document.getElementById('toggle-trails').addEventListener('click', () => {
            this.renderer.showTrails = !this.renderer.showTrails;
            document.getElementById('stat-trails').textContent = this.renderer.showTrails ? 'ON' : 'OFF';
        });

        document.getElementById('toggle-rotate').addEventListener('click', () => {
            this.renderer.autoRotate = !this.renderer.autoRotate;
            document.getElementById('stat-rotate').textContent = this.renderer.autoRotate ? 'ON' : 'OFF';
        });

        document.getElementById('toggle-mesh').addEventListener('click', (e) => {
            const btn = e.target;
            this.renderer.showMesh = !this.renderer.showMesh;
            btn.textContent = this.renderer.showMesh ? 'ON' : 'OFF';
        });

        this.setupBifurcation();
        this.setupSymmetryControls();
        this.setupParamAnimation();
        this.setupPresetsUI();
        this.setupHeatmapExplorer();
        this.setupTimeControls();

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
                this.loadAttractor(keys[(idx - 1 + keys.length) % keys.length]);
            }
            if (e.code === 'ArrowRight') {
                const keys = Object.keys(ATTRACTORS);
                const idx = keys.indexOf(this.currentAttractor);
                this.loadAttractor(keys[(idx + 1) % keys.length]);
            }
            if (e.code === 'Home') {
                this.renderer.resetCamera();
            }
            if (e.code === 'KeyM') {
                this.morph();
            }
            if (e.code === 'KeyW') {
                this.cycleTimeDirection();
            }
        });
    },

    setupSymmetryControls() {
        const symmetrySelect = document.getElementById('symmetry-mode');
        if (symmetrySelect) {
            symmetrySelect.addEventListener('change', (e) => {
                const order = parseInt(e.target.value);
                this.renderer.setSymmetryMode(order);
                document.getElementById('stat-symmetry').textContent = order === 0 ? 'OFF' : `${order}-way`;
            });
        }

        const velocityToggle = document.getElementById('toggle-velocity');
        if (velocityToggle) {
            velocityToggle.addEventListener('click', () => {
                this.renderer.toggleVelocityColor();
                document.getElementById('stat-velocity').textContent = this.renderer.showVelocity ? 'ON' : 'OFF';
            });
        }
    },

    setupParamAnimation() {
        const animParamSelect = document.getElementById('anim-param');
        const animSpeedSlider = document.getElementById('anim-speed');
        const animToggle      = document.getElementById('toggle-animation');

        if (animParamSelect) {
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
    },

    updateParamAnimation() {
        if (!this.paramAnimation || !this.paramAnimParam) return;

        const attractor = ATTRACTORS[this.currentAttractor];
        const [min, max] = attractor.ranges[this.paramAnimParam];
        const range = max - min;

        this.time += this.paramAnimSpeed * 0.01;
        const animValue = min + (Math.sin(this.time) + 1) / 2 * range;

        this.simulation.params[this.paramAnimParam] = animValue;

        const valueEl  = document.getElementById(`val-${this.paramAnimParam}`);
        const sliderEl = document.querySelector(`input[data-param="${this.paramAnimParam}"]`);
        if (valueEl)  valueEl.textContent = animValue.toFixed(3);
        if (sliderEl) sliderEl.value = animValue;
    },

    setupAudio() {
        const toggleAudio = document.getElementById('toggle-audio');
        if (toggleAudio) {
            toggleAudio.addEventListener('click', () => {
                window.audioEngine.toggle();
                const isEnabled = window.audioEngine.enabled;
                document.getElementById('stat-audio').textContent = isEnabled ? 'ON' : 'OFF';
                document.getElementById('stat-audio').style.color = isEnabled ? '#64b5f6' : '';

                const panel = document.getElementById('audio-panel');
                panel.style.display = isEnabled ? 'block' : 'none';

                this.updateAudioSignature();
            });
        }

        const volumeSlider = document.getElementById('audio-volume');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value) / 100;
                window.audioEngine.setVolume(vol);
                document.getElementById('audio-volume-value').textContent = `${Math.round(vol * 100)}%`;
            });
        }

        window.audioEngine.setVolume(0.3);
    },

    setupBifurcation() {
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

        document.getElementById('bifurcation-close').addEventListener('click', () => {
            this.toggleBifurcation();
        });

        document.getElementById('bifurcation-generate').addEventListener('click', () => {
            this.generateBifurcation();
        });

        select.addEventListener('change', () => {
            const ranges = ATTRACTORS[this.currentAttractor].ranges;
            const [min, max] = ranges[select.value] || [0, 1];
            document.getElementById('bifurcation-min').value = min;
            document.getElementById('bifurcation-max').value = max;
            document.getElementById('bifurcation-subtitle').textContent =
                `Varying parameter ${select.value} from ${min} to ${max}`;
        });
    },

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
    },

    generateBifurcation() {
        const canvas = document.getElementById('bifurcation-canvas');
        canvas.width  = Math.min(800, window.innerWidth - 100);
        canvas.height = Math.min(500, window.innerHeight - 300);
        const ctx = canvas.getContext('2d');

        const paramKey = document.getElementById('bifurcation-param').value;
        const paramMin = parseFloat(document.getElementById('bifurcation-min').value);
        const paramMax = parseFloat(document.getElementById('bifurcation-max').value);
        const numSteps = parseInt(document.getElementById('bifurcation-steps').value);

        document.getElementById('bifurcation-subtitle').textContent =
            `Varying parameter ${paramKey} from ${paramMin.toFixed(1)} to ${paramMax.toFixed(1)}`;

        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const stepSize = (paramMax - paramMin) / numSteps;
        const burnIn = 200, plotPoints = 100;
        let stepIndex = 0;

        const generateBatch = () => {
            const batchSize = 5;
            for (let b = 0; b < batchSize && stepIndex < numSteps; b++, stepIndex++) {
                const paramValue = paramMin + stepIndex * stepSize;
                const x = (stepIndex / numSteps) * canvas.width;

                const tempSim = new AttractorSimulation(this.currentAttractor);
                tempSim.params[paramKey] = paramValue;

                for (let i = 0; i < burnIn; i++) tempSim.step();

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
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '10px SF Mono, monospace';
                ctx.fillText(`${paramMin.toFixed(1)}`, 5, canvas.height - 5);
                ctx.fillText(`${paramMax.toFixed(1)}`, canvas.width - 40, canvas.height - 5);
                ctx.fillText(`x`, canvas.width - 15, canvas.height / 2);
            }
        };

        generateBatch();
    },

    setupHeatmapExplorer() {
        const toggleBtn = document.getElementById('toggle-heatmap');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            const attractor = ATTRACTORS[this.currentAttractor];
            const paramKeys = Object.keys(attractor.ranges);
            if (paramKeys.length < 2) return;
            this.generateParamHeatmap(paramKeys[0], paramKeys[1]);
        });
    },

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

                const valA = minA + (col / (resolution-1)) * (maxA-minA);
                const valB = minB + (row / (resolution-1)) * (maxB-minB);

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

                const bounds = attractor.bounds;
                const inBounds = Math.abs(sim.position[0]) < (bounds[1]-bounds[0])*2 &&
                                 Math.abs(sim.position[1]) < (bounds[3]-bounds[2])*2;

                let hue;
                if (diverged)      hue = 0;
                else if (inBounds) hue = 240;
                else               hue = 60;

                ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.8)`;
                ctx.fillRect(col*cellW, row*cellH, cellW+1, cellH+1);
            }

            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '10px SF Mono, monospace';
            ctx.fillText(`${minA.toFixed(1)}`, 5, canvas.height - 5);
            ctx.fillText(`${maxA.toFixed(1)}`, canvas.width - 40, canvas.height - 5);
            ctx.fillText(`${paramA} →`, canvas.width/2 - 20, canvas.height - 5);
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
    },

    setupTimeControls() {
        const toggleTime = document.getElementById('toggle-time');
        if (toggleTime) {
            toggleTime.addEventListener('click', () => {
                this.cycleTimeDirection();
            });
        }
    },

    cycleTimeDirection() {
        this.timeDirection = this.timeDirection === 1 ? -1 : 1;
        const label = this.timeDirection === 1 ? 'FWD' : 'REV';
        const color = this.timeDirection === 1 ? '#64b5f6' : '#ef5350';

        const statEl = document.getElementById('stat-time');
        if (statEl) {
            statEl.textContent = label;
            statEl.style.color = color;
        }
    }

});
