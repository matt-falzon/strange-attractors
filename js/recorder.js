// Recording module - canvas capture, MediaRecorder, camera presets
// Extends App.prototype (loaded after app.js, controls.js)

Object.assign(App.prototype, {

    // ── Recording state ──────────────────────────────────────────────
    _recorder: null,
    _recordingChunks: [],
    _recordingStream: null,
    _recordingStartTime: 0,
    _recordingTimerInterval: null,
    _cameraAnimId: null,
    _savedCamera: null,

    // ── Public API ───────────────────────────────────────────────────

    startRecording(fps = 30) {
        const canvas = this.renderer.canvas;

        // Capture canvas stream at requested fps
        this._recordingStream = canvas.captureStream(fps);

        // Determine supported mime type
        const mimeTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
        ];
        let selectedMime = '';
        for (const mime of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mime)) {
                selectedMime = mime;
                break;
            }
        }
        if (!selectedMime) {
            console.warn('MediaRecorder WebM not supported in this browser');
            return false;
        }

        this._recorder = new MediaRecorder(this._recordingStream, {
            mimeType: selectedMime,
            videoBitsPerSecond: 5_000_000,
        });
        this._recordingChunks = [];

        this._recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                this._recordingChunks.push(e.data);
            }
        };

        this._recorder.onstop = () => {
            this._downloadRecording();
            this._teardownRecording();
        };

        this._recorder.start(100); // collect data every 100ms
        this._recordingStartTime = performance.now();

        this._showRecordingOverlay();
        this._startRecordingTimer();

        console.log(`Recording started (${selectedMime}, ${fps}fps)`);
        return true;
    },

    stopRecording() {
        if (!this._recorder || this._recorder.state === 'inactive') return;

        // Stop camera animation
        this._stopCameraAnimation();

        this._recorder.stop();
        this._stopRecordingTimer();
        this._hideRecordingOverlay();

        console.log('Recording stopped');
    },

    pauseRecording() {
        if (!this._recorder || this._recorder.state !== 'recording') return;
        this._recorder.pause();
        this._stopRecordingTimer();
        this._updateRecordingOverlay('PAUSED');
        console.log('Recording paused');
    },

    resumeRecording() {
        if (!this._recorder || this._recorder.state !== 'paused') return;
        this._recorder.resume();
        this._startRecordingTimer();
        this._updateRecordingOverlay('REC');
        console.log('Recording resumed');
    },

    isRecording() {
        return !!(this._recorder && this._recorder.state === 'recording');
    },

    // ── Camera animation presets ─────────────────────────────────────

    orbit(duration = 10000, speed = 0.005) {
        this._savedCamera = {
            theta: this.renderer.camera.theta,
            phi: this.renderer.camera.phi,
            radius: this.renderer.camera.radius,
            target: [...this.renderer.camera.target],
        };
        this.renderer.autoRotate = false;

        const startTheta = this.renderer.camera.theta;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = elapsed / duration;
            if (t >= 1) {
                this._stopCameraAnimation();
                return;
            }
            // Smooth orbit: theta sweeps, phi oscillates gently
            this.renderer.camera.theta = startTheta + speed * elapsed;
            this.renderer.camera.phi = this._savedCamera.phi + Math.sin(elapsed * 0.001) * 0.3;
            this._cameraAnimId = requestAnimationFrame(animate);
        };
        this._cameraAnimId = requestAnimationFrame(animate);
        return () => this._stopCameraAnimation();
    },

    zoomIn(duration = 3000, targetRadius = 10) {
        this._savedCamera = {
            theta: this.renderer.camera.theta,
            phi: this.renderer.camera.phi,
            radius: this.renderer.camera.radius,
            target: [...this.renderer.camera.target],
        };
        this.renderer.autoRotate = false;

        const startRadius = this.renderer.camera.radius;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            // Ease in-out cubic
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            this.renderer.camera.radius = startRadius + (targetRadius - startRadius) * ease;
            if (t < 1) {
                this._cameraAnimId = requestAnimationFrame(animate);
            } else {
                this._stopCameraAnimation();
            }
        };
        this._cameraAnimId = requestAnimationFrame(animate);
        return () => this._stopCameraAnimation();
    },

    zoomOut(duration = 3000, targetRadius = 100) {
        this._savedCamera = {
            theta: this.renderer.camera.theta,
            phi: this.renderer.camera.phi,
            radius: this.renderer.camera.radius,
            target: [...this.renderer.camera.target],
        };
        this.renderer.autoRotate = false;

        const startRadius = this.renderer.camera.radius;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            this.renderer.camera.radius = startRadius + (targetRadius - startRadius) * ease;
            if (t < 1) {
                this._cameraAnimId = requestAnimationFrame(animate);
            } else {
                this._stopCameraAnimation();
            }
        };
        this._cameraAnimId = requestAnimationFrame(animate);
        return () => this._stopCameraAnimation();
    },

    figure8(duration = 15000, radius = 50, speed = 0.0005) {
        this._savedCamera = {
            theta: this.renderer.camera.theta,
            phi: this.renderer.camera.phi,
            radius: this.renderer.camera.radius,
            target: [...this.renderer.camera.target],
        };
        this.renderer.autoRotate = false;

        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            const t = elapsed / duration;
            if (t >= 1) {
                this._stopCameraAnimation();
                return;
            }
            // Lissajous figure-8: parametric curve
            const angle = speed * elapsed;
            this.renderer.camera.theta = Math.sin(angle) * 1.5;
            this.renderer.camera.phi = Math.sin(angle * 2) * 0.8 + 1.0;
            this.renderer.camera.radius = radius + Math.cos(angle * 3) * 15;
            this._cameraAnimId = requestAnimationFrame(animate);
        };
        this._cameraAnimId = requestAnimationFrame(animate);
        return () => this._stopCameraAnimation();
    },

    // Convenience: record with camera preset
    recordWithPreset(presetName, fps = 30, duration = 10000) {
        const started = this.startRecording(fps);
        if (!started) return;

        const presets = {
            orbit: () => this.orbit(duration),
            zoomIn: () => this.zoomIn(duration),
            zoomOut: () => this.zoomOut(duration),
            figure8: () => this.figure8(duration),
        };

        const stopFn = (presets[presetName] || presets.orbit)();

        setTimeout(() => {
            this.stopRecording();
            if (stopFn) stopFn();
        }, duration);
    },

    // ── Private helpers ──────────────────────────────────────────────

    _downloadRecording() {
        const blob = new Blob(this._recordingChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `strange-attractor-${this.currentAttractor}-${ts}.webm`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        console.log(`Downloaded: ${link.download} (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
    },

    _teardownRecording() {
        // Stop all tracks to release canvas capture
        if (this._recordingStream) {
            this._recordingStream.getTracks().forEach(track => track.stop());
            this._recordingStream = null;
        }
        this._recorder = null;
        this._recordingChunks = [];
        this._stopCameraAnimation();
    },

    _stopCameraAnimation() {
        if (this._cameraAnimId) {
            cancelAnimationFrame(this._cameraAnimId);
            this._cameraAnimId = null;
        }
        // Restore saved camera state if available
        if (this._savedCamera) {
            this.renderer.camera.theta = this._savedCamera.theta;
            this.renderer.camera.phi = this._savedCamera.phi;
            this.renderer.camera.radius = this._savedCamera.radius;
            this.renderer.camera.target = this._savedCamera.target;
            this._savedCamera = null;
            this.renderer.autoRotate = true;
        }
    },

    _showRecordingOverlay() {
        // Remove existing overlay if present
        this._hideRecordingOverlay();

        const overlay = document.createElement('div');
        overlay.id = 'recording-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 16px;
            right: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(20, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 50, 50, 0.3);
            border-radius: 8px;
            z-index: 100;
            font-family: monospace;
            font-size: 12px;
            color: #ff6b6b;
        `;

        const redDot = document.createElement('span');
        redDot.id = 'rec-dot';
        redDot.style.cssText = `
            width: 10px;
            height: 10px;
            background: #ff3333;
            border-radius: 50%;
            display: inline-block;
            animation: rec-blink 1s ease-in-out infinite;
        `;

        // Inject blink keyframes once
        if (!document.getElementById('rec-blink-style')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'rec-blink-style';
            styleEl.textContent = `@keyframes rec-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }`;
            document.head.appendChild(styleEl);
        }

        const timer = document.createElement('span');
        timer.id = 'rec-timer';
        timer.textContent = '00:00';

        overlay.appendChild(redDot);
        overlay.appendChild(timer);
        document.body.appendChild(overlay);
    },

    _hideRecordingOverlay() {
        const overlay = document.getElementById('recording-overlay');
        if (overlay) overlay.remove();
    },

    _startRecordingTimer() {
        this._stopRecordingTimer();
        this._recordingTimerInterval = setInterval(() => {
            const timerEl = document.getElementById('rec-timer');
            if (!timerEl) return;
            const elapsed = Math.floor((performance.now() - this._recordingStartTime) / 1000);
            const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const secs = String(elapsed % 60).padStart(2, '0');
            timerEl.textContent = `${mins}:${secs}`;
        }, 200);
    },

    _stopRecordingTimer() {
        if (this._recordingTimerInterval) {
            clearInterval(this._recordingTimerInterval);
            this._recordingTimerInterval = null;
        }
    },

    _updateRecordingOverlay(status) {
        const timerEl = document.getElementById('rec-timer');
        if (timerEl) timerEl.textContent = status;
        const dotEl = document.getElementById('rec-dot');
        if (dotEl) {
            dotEl.style.animation = status === 'PAUSED' ? 'none' : 'rec-blink 1s ease-in-out infinite';
            dotEl.style.background = status === 'PAUSED' ? '#ffaa00' : '#ff3333';
        }
    },
});
