// Generative Audio Synthesis for Strange Attractors
// Web Audio API driven by attractor trajectory.
// Position maps to frequency, velocity to amplitude.
// Each attractor gets a unique sonic signature.

class AttractorAudio {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.volume = 0.3;
        this.currentAttractor = null;
        this.initialized = false;

        // Audio nodes (created lazily)
        this.masterGain = null;
        this.oscillator = null;
        this.filterNode = null;
        this.velocityGain = null;

        // State tracking for smooth transitions
        this.targetFreq = 220;
        this.currentFreq = 220;
        this.targetAmp = 0;
        this.currentAmp = 0;
        this.prevPosition = [0, 0, 0];
        this.prevTime = 0;

        // Attractor sonic signatures: oscillator type, base frequency, character
        this.signatures = {
            lorenz: {
                type: 'triangle',       // Classic butterfly wings
                baseFreq: 100,
                freqRange: [80, 400],
                filterQ: 2,
                filterFreq: 1200,
                description: 'warm, fluttering'
            },
            aizawa: {
                type: 'sine',           // Toroidal twist
                baseFreq: 120,
                freqRange: [60, 350],
                filterQ: 1,
                filterFreq: 800,
                description: 'deep, swirling'
            },
            chua: {
                type: 'sawtooth',       // Double-scroll chaos
                baseFreq: 150,
                freqRange: [50, 500],
                filterQ: 5,
                filterFreq: 600,
                description: 'sharp, electrical'
            },
            rossler: {
                type: 'sine',           // Single-scroll spiral
                baseFreq: 130,
                freqRange: [70, 300],
                filterQ: 1,
                filterFreq: 1000,
                description: 'smooth, spiraling'
            },
            thomas: {
                type: 'triangle',       // Sinusoidal coupling
                baseFreq: 180,
                freqRange: [100, 350],
                filterQ: 3,
                filterFreq: 2000,
                description: 'triadic, resonant'
            },
            sprott: {
                type: 'square',         // Polynomial simplicity
                baseFreq: 90,
                freqRange: [40, 300],
                filterQ: 0.5,
                filterFreq: 700,
                description: 'digital, minimal'
            },
            duffing: {
                type: 'sawtooth',       // Forced nonlinear oscillator
                baseFreq: 200,
                freqRange: [80, 600],
                filterQ: 4,
                filterFreq: 1500,
                description: 'mechanical, oscillating'
            },
            chen: {
                type: 'triangle',       // Figure-8 infinity
                baseFreq: 110,
                freqRange: [60, 440],
                filterQ: 2,
                filterFreq: 1100,
                description: 'dual-lobe, flowing'
            },
            halvorsen: {
                type: 'sine',           // Intertwined loops
                baseFreq: 140,
                freqRange: [80, 360],
                filterQ: 1.5,
                filterFreq: 900,
                description: 'dual, intertwining'
            },
            arneodo: {
                type: 'sine',           // Spiral galaxy
                baseFreq: 75,
                freqRange: [40, 280],
                filterQ: 0.8,
                filterFreq: 600,
                description: 'celestial, vast'
            },
            cliffs: {
                type: 'triangle',       // Spiky flower
                baseFreq: 160,
                freqRange: [80, 480],
                filterQ: 3,
                filterFreq: 1800,
                description: 'sharp, radiating'
            },
            stenstrom: {
                type: 'sine',           // Knotted ring
                baseFreq: 110,
                freqRange: [60, 320],
                filterQ: 2,
                filterFreq: 1000,
                description: 'knotted, topological'
            },
            walkerc: {
                type: 'triangle',       // Mobius-like ribbon
                baseFreq: 125,
                freqRange: [70, 380],
                filterQ: 1.5,
                filterFreq: 1100,
                description: 'twisted, ribbon-like'
            },
            hyper_lorenz: {
                type: 'sawtooth',       // Hyperchaotic
                baseFreq: 80,
                freqRange: [40, 500],
                filterQ: 4,
                filterFreq: 2000,
                description: 'multi-dimensional, intense'
            },
            sparrow: {
                type: 'triangle',       // Three-scroll
                baseFreq: 150,
                freqRange: [80, 400],
                filterQ: 2,
                filterFreq: 1400,
                description: 'tripartite, blooming'
            },
            david: {
                type: 'sine',           // Flower-like
                baseFreq: 220,
                freqRange: [120, 440],
                filterQ: 1,
                filterFreq: 1600,
                description: 'organic, petal-like'
            },
            modified_lorenz: {
                type: 'triangle',       // Modified butterfly
                baseFreq: 105,
                freqRange: [70, 420],
                filterQ: 2.5,
                filterFreq: 1300,
                description: 'variant, shifting'
            },
            t_system: {
                type: 'triangle',       // Simple triple-loop
                baseFreq: 190,
                freqRange: [100, 380],
                filterQ: 2,
                filterFreq: 1500,
                description: 'minimal, elegant'
            }
        };

        // Default signature for unknown attractors
        this.defaultSignature = {
            type: 'sine',
            baseFreq: 150,
            freqRange: [80, 400],
            filterQ: 1,
            filterFreq: 1000,
            description: 'ambient, neutral'
        };
    }

    /**
     * Initialize the audio context and nodes.
     * Must be called from a user gesture (click/tap).
     */
    init() {
        if (this.initialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain (volume control)
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);

            // Low-pass filter for ambient texture
            this.filterNode = this.ctx.createBiquadFilter();
            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.value = 1000;
            this.filterNode.Q.value = 1;
            this.filterNode.connect(this.masterGain);

            // Velocity-based amplitude modulation
            this.velocityGain = this.ctx.createGain();
            this.velocityGain.gain.value = 0.3;
            this.velocityGain.connect(this.filterNode);

            // Create oscillator (type set by attractor)
            this.oscillator = this.ctx.createOscillator();
            this.oscillator.type = 'sine';
            this.oscillator.frequency.value = this.currentFreq;
            this.oscillator.connect(this.velocityGain);
            this.oscillator.start();

            this.initialized = true;
            this.enabled = true;
            console.log('Audio engine initialized');
        } catch (e) {
            console.warn('Web Audio API not available:', e.message);
        }
    }

    /**
     * Set the active attractor and configure sonic signature.
     */
    setAttractor(key, simulation) {
        this.currentAttractor = key;
        this.prevPosition = [...(simulation ? simulation.position : [0, 0, 0])];

        const sig = this.signatures[key] || this.defaultSignature;

        if (!this.initialized) return;

        // Smoothly transition oscillator type (must stop/restart for type change)
        const now = this.ctx.currentTime;

        // Update oscillator type - smooth transition
        this.oscillator.frequency.setTargetAtTime(sig.baseFreq, now, 0.1);

        // Update filter characteristics
        this.filterNode.frequency.setTargetAtTime(sig.filterFreq, now, 0.15);
        this.filterNode.Q.setTargetAtTime(sig.filterQ, now, 0.15);

        // Change oscillator type requires restart
        if (this.oscillator.type !== sig.type) {
            const oldOsc = this.oscillator;
            this.oscillator.stop(now + 0.05);
            this.oscillator.disconnect();

            this.oscillator = this.ctx.createOscillator();
            this.oscillator.type = sig.type;
            this.oscillator.frequency.value = sig.baseFreq;
            this.oscillator.connect(this.velocityGain);
            this.oscillator.start(now + 0.05);
        }

        this.targetFreq = sig.baseFreq;
        console.log(`Audio: switched to ${key} (${sig.type}, ${sig.description})`);
    }

    /**
     * Update audio from simulation state.
     * Position maps to frequency, velocity to amplitude.
     * Call each animation frame for smooth updates.
     */
    update(simulation) {
        if (!this.initialized || !this.enabled || !simulation) return;

        const pos = simulation.position;
        const now = this.ctx.currentTime;
        const sig = this.signatures[this.currentAttractor] || this.defaultSignature;

        // Calculate velocity (magnitude of displacement)
        const dx = pos[0] - this.prevPosition[0];
        const dy = pos[1] - this.prevPosition[1];
        const dz = pos[2] - this.prevPosition[2];
        const velocity = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Map position to frequency
        // Use the attractor's bounds to normalize position into 0..1 range
        const bounds = simulation.attractor ? simulation.attractor.bounds : [-30, 30, -30, 30, 0, 60];
        const xRange = bounds[1] - bounds[0];
        const yRange = bounds[3] - bounds[2];
        const zRange = bounds[5] - bounds[4];

        // Normalize each axis to 0..1, then blend
        const nx = (pos[0] - bounds[0]) / xRange;
        const ny = (pos[1] - bounds[2]) / yRange;
        const nz = (pos[2] - bounds[4]) / zRange;

        // Blend axes into a single frequency mapping (weight z-axis more for "height" feel)
        const normalizedPos = (nx + ny + nz * 2) / 4;

        // Clamp to [0, 1]
        const clampedPos = Math.max(0, Math.min(1, normalizedPos));

        // Map to frequency range for this attractor
        const [minFreq, maxFreq] = sig.freqRange;
        const targetFreq = minFreq + clampedPos * (maxFreq - minFreq);

        // Smooth frequency transition (exponential smoothing)
        this.currentFreq += (targetFreq - this.currentFreq) * 0.08;

        // Map velocity to amplitude
        // Higher velocity = louder sound
        const maxVelocity = 5; // normalize velocity
        const rawAmp = Math.min(velocity / maxVelocity, 1);
        // Curve the amplitude for better perception
        const targetAmp = Math.pow(rawAmp, 0.5) * 0.4; // Cap at 40% of max gain

        // Smooth amplitude transition
        this.currentAmp += (targetAmp - this.currentAmp) * 0.1;

        // Apply with setTargetAtTime for smooth Web Audio transitions
        const smoothingTime = 0.05; // 50ms smoothing
        this.oscillator.frequency.setTargetAtTime(this.currentFreq, now, smoothingTime);
        this.velocityGain.gain.setTargetAtTime(this.currentAmp, now, smoothingTime);

        // Update filter frequency based on velocity (more velocity = brighter)
        const filterBoost = sig.filterFreq + velocity * 50;
        this.filterNode.frequency.setTargetAtTime(
            Math.min(filterBoost, sig.filterFreq * 3),
            now,
            smoothingTime
        );

        // Store position for next frame
        this.prevPosition = [...pos];
    }

    /**
     * Set master volume (0..1)
     */
    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
        }
    }

    /**
     * Toggle audio on/off
     */
    toggle() {
        if (!this.initialized) {
            this.init();
        }

        this.enabled = !this.enabled;

        if (this.enabled) {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            // Fade in
            this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.3);
        } else {
            // Fade out
            this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
        }

        return this.enabled;
    }

    /**
     * Resume audio context (for browsers that suspend it)
     */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Get current audio state for display
     */
    getState() {
        return {
            enabled: this.enabled,
            initialized: this.initialized,
            volume: this.volume,
            attractor: this.currentAttractor,
            frequency: this.currentFreq,
            amplitude: this.currentAmp
        };
    }
}

// Create global singleton
window.audioEngine = new AttractorAudio();
