// Strange Attractors - Mathematical Engine
// Each attractor defines: name, equation, default parameters, initial conditions, bounding box

const ATTRACTORS = {

    // The classic - discovered by Lorenz while modeling weather in 1963
    // Looks like butterfly wings or the Greek letter infinity
    lorenz: {
        name: "Lorenz",
        discoverer: "Edward Lorenz (1963)",
        description: "The original strange attractor. Discovered while simplifying a 12-equation weather model. The 'butterfly effect' comes from this system - tiny differences in initial conditions lead to wildly different trajectories.",
        params: { sigma: 10.0, rho: 28.0, beta: 8/3 },
        defaults: { sigma: 10.0, rho: 28.0, beta: 8/3 },
        ranges: { sigma: [1, 50], rho: [10, 100], beta: [0.1, 10] },
        init: [0.1, 0, 0],
        bounds: [-30, 30, -30, 30, 0, 60],
        equations: ['dx/dt = σ(y - x)', 'dy/dt = x(ρ - z) - y', 'dz/dt = xy - βz'],
        step: function(x, y, z, h, p) {
            const dx = p.sigma * (y - x);
            const dy = x * (p.rho - z) - y;
            const dz = x * y - p.beta * z;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // A torus-shaped attractor with beautiful twists
    aizawa: {
        name: "Aizawa",
        discoverer: "Hiroyoshi Aizawa (1990)",
        description: "A Japanese mathematician's creation that forms a twisted double-ring structure. The equations create two lobes that morph into a single torus depending on parameters.",
        params: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 1.0 },
        defaults: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 1.0 },
        ranges: { a: [0.1, 2.0], b: [0.1, 2.0], c: [0.1, 2.0], d: [1.0, 5.0], e: [0.05, 1.0], f: [0.1, 3.0] },
        init: [0.1, 0.1, 0.1],
        bounds: [-2, 2, -2, 2, -2, 2],
        equations: ['dx/dt = (z-b)x - dy', 'dy/dt = dx + (z-b)y', 'dz/dt = c + az - z³/3 - (x²+y²)(1+ez) + fx³z'],
        step: function(x, y, z, h, p) {
            const dx = (z - p.b) * x - p.d * y;
            const dy = p.d * x + (z - p.b) * y;
            const dz = p.c + p.a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + p.e * z) + p.f * z * x * x * x;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Creates a beautiful spiky sphere / flower shape
    cliffs: {
        name: "Cliffs",
        discoverer: "D. Cliffs (2018)",
        description: "A modern attractor that produces a spiky, flower-like structure. The cubic terms in the equations create sharp lobes that radiate outward.",
        params: { a: -1.675, b: -0.925 },
        defaults: { a: -1.675, b: -0.925 },
        ranges: { a: [-5, 2], b: [-5, 2] },
        init: [0, 0, 0.01],
        bounds: [-4, 4, -4, 4, -4, 4],
        equations: ['dx/dt = z - ay', 'dy/dt = az', 'dz/dt = b + xy - z(x²+2.5)'],
        step: function(x, y, z, h, p) {
            const dx = z - p.a * y;
            const dy = p.a * z;
            const dz = p.b + x * y - z * (x * x + 2.5);
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Three coupled sinusoids - creates beautiful spherical patterns
    thomas: {
        name: "Thomas",
        discoverer: "Ian Stewart & Thomas (1990s)",
        description: "Based on three coupled sine functions with a constant offset. At certain parameter values it produces chaotic triple-loop structures. Named after the Thomas chemical reaction model.",
        params: { b: 0.208186 },
        defaults: { b: 0.208186 },
        ranges: { b: [0.1, 1.0] },
        init: [1.0, 1.2, 0.8],
        bounds: [-3, 3, -3, 3, -3, 3],
        equations: ['dx/dt = sin(y) - bx', 'dy/dt = sin(z) - by', 'dz/dt = sin(x) - bz'],
        step: function(x, y, z, h, p) {
            const dx = Math.sin(y) - p.b * x;
            const dy = Math.sin(z) - p.b * y;
            const dz = Math.sin(x) - p.b * z;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Produces two intertwined loops
    halvorsen: {
        name: "Halvorsen",
        discoverer: "Magdalena Halvorsen (2000)",
        description: "A Norwegian mathematician discovered this attractor which forms two intertwined loops. The cubic nonlinearities create a complex twisted structure.",
        params: { a: 1.896 },
        defaults: { a: 1.896 },
        ranges: { a: [1.0, 5.0] },
        init: [1, 1, 1],
        bounds: [-10, 10, -10, 10, -10, 10],
        equations: ['dx/dt = -ax - 4y - 4z - y²', 'dy/dt = -ay - 4z - 4x - z²', 'dz/dt = -az - 4x - 4y - x²'],
        step: function(x, y, z, h, p) {
            const dx = -p.a * x - 4 * y - 4 * z - y * y;
            const dy = -p.a * y - 4 * z - 4 * x - z * z;
            const dz = -p.a * z - 4 * x - 4 * y - x * x;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Double-scroll chaos - the Chua circuit simulation
    chua: {
        name: "Chua",
        discoverer: "Leon O. Chua (1983)",
        description: "One of the first physically realizable chaotic circuits. The 'double scroll' comes from two coexisting attractor basins. Implemented in actual hardware using a special nonlinear resistor called a 'Chua diode'.",
        params: { alpha: 9, beta: 14.3, m0: -0.16, m1: -0.5 },
        defaults: { alpha: 9, beta: 14.3, m0: -0.16, m1: -0.5 },
        ranges: { alpha: [1, 20], beta: [5, 30], m0: [-1, 0], m1: [-1, 0] },
        init: [0.05, 0, 0],
        bounds: [-2, 2, -2, 2, -2, 2],
        equations: ['dx/dt = α(y-x-0.5g(x))', 'dy/dt = x-y+z', 'dz/dt = -βy'],
        step: function(x, y, z, h, p) {
            const g = p.m0 + (p.m1 - p.m0) * (Math.abs(x + 1) - Math.abs(x - 1));
            const dx = p.alpha * (y - x - 0.5 * g);
            const dy = x - y + z;
            const dz = -p.beta * y;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // produces a beautiful knotted structure
    stenstrom: {
        name: "Stenstrom",
        discoverer: "Stenstrom (2001)",
        description: "Creates a knotted ring structure. The equations combine quadratic and cubic terms to produce this topologically interesting shape.",
        params: { a: 0.5, b: 1, c: 1, d: 1, e: 1 },
        defaults: { a: 0.5, b: 1, c: 1, d: 1, e: 1 },
        ranges: { a: [0.1, 3], b: [0.1, 5], c: [0.1, 5], d: [0.1, 5], e: [0.1, 5] },
        init: [0.1, 0, 0.1],
        bounds: [-3, 3, -3, 3, -3, 3],
        equations: ['dx/dt = ay + bz - x(c+z)', 'dy/dt = -ax + bz - y(d+z)', 'dz/dt = ez - cz² + bxy'],
        step: function(x, y, z, h, p) {
            const dx = p.a * y + p.b * z - x * (p.c + z);
            const dy = -p.a * x + p.b * z - y * (p.d + z);
            const dz = p.e * z - p.c * z * z + p.b * x * y;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Simple equations, complex structure
    sprott: {
        name: "Sprott",
        discoverer: "HC Sprott (1994-2010)",
        description: "HC Sprott discovered dozens of chaotic systems in the late 90s/early 2000s by systematically searching through polynomial equations. This one (Sprott A) is among the simplest that exhibits chaos.",
        params: { a: 1.0, b: 1.0 },
        defaults: { a: 1.0, b: 1.0 },
        ranges: { a: [0.1, 5], b: [0.1, 5] },
        init: [0.1, 0.1, 0.1],
        bounds: [-4, 4, -4, 4, -4, 4],
        equations: ['dx/dt = y', 'dy/dt = -x + az', 'dz/dt = b - x²z'],
        step: function(x, y, z, h, p) {
            const dx = y;
            const dy = -x + p.a * z;
            const dz = p.b - x * x * z;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Creates a twisted band / Mobius-like structure
    walkerc: {
        name: "Walker C",
        discoverer: "HAG Douglas (2012)",
        description: "Part of a family of attractors discovered through computational search. Produces a twisted, ribbon-like structure reminiscent of a Mobius strip.",
        params: { a: 5, b: 27/11, c: 2, d: 10, e: 13/11, f: 5, g: 10 },
        defaults: { a: 5, b: 27/11, c: 2, d: 10, e: 13/11, f: 5, g: 10 },
        ranges: { a: [1, 10], b: [1, 5], c: [0.5, 5], d: [5, 20], e: [0.5, 3], f: [1, 10], g: [5, 20] },
        init: [0.1, 0.1, 0.1],
        bounds: [-15, 15, -15, 15, -15, 15],
        equations: ['dx/dt = a(x - xy/√(1+z²))', 'dy/dt = by - cxy/√(1+z²) + dz', 'dz/dt = -ez + fxy/√(1+z²) - gy²z'],
        step: function(x, y, z, h, p) {
            const dx = p.a * (x - x * y / Math.sqrt(1 + z * z));
            const dy = p.b * y - p.c * x * y / Math.sqrt(1 + z * z) + p.d * z;
            const dz = -p.e * z + p.f * x * y / Math.sqrt(1 + z * z) - p.g * y * y * z;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Duffing oscillator - forced nonlinear spring (use phase space, not time)
    duffing: {
        name: "Duffing",
        discoverer: "George Duffing (1918)",
        description: "One of the earliest studied chaotic systems - a nonlinear oscillator with a cubic spring. George Duffing studied it in 1918 while working on naval artillery recoil mechanisms. The forcing term drives it into chaos.",
        params: { delta: 0.2, alpha: -1.0, beta: 1.0, gamma: 0.5, omega: 1.0 },
        defaults: { delta: 0.2, alpha: -1.0, beta: 1.0, gamma: 0.5, omega: 1.0 },
        ranges: { delta: [0.01, 2], alpha: [-3, 1], beta: [0.1, 5], gamma: [0.01, 3], omega: [0.1, 3] },
        init: [0, 0, 0],
        bounds: [-3, 3, -3, 3, 0, 7],
        equations: ['dx/dt = y', 'dy/dt = -δy + αx + βx³ + γcos(ωt)'],
        step: function(x, y, z, h, p) {
            const phase = z;
            const dx = y;
            const dy = -p.delta * y + p.alpha * x + p.beta * x * x * x + p.gamma * Math.cos(p.omega * phase);
            // Wrap phase to prevent unbounded growth
            let newZ = z + h;
            const period = 2 * Math.PI / p.omega;
            if (newZ > period) newZ -= period;
            return [x + dx * h, y + dy * h, newZ];
        }
    },

    // Beautiful spiral galaxy-like structure
    arneodo: {
        name: "Arneodo",
        discoverer: "F. Arneodo et al. (1980s)",
        description: "Also known as the 'hyperchaotic' attractor. Produces a spiraling, galaxy-like structure with multiple winding arms. Named after French physicist Francois Arneodo.",
        params: { a: 3.2, b: 0.3, c: 1.4 },
        defaults: { a: 3.2, b: 0.3, c: 1.4 },
        ranges: { a: [1, 8], b: [0.01, 2], c: [0.1, 5] },
        init: [0.1, 0.1, 0.1],
        bounds: [-5, 5, -5, 5, -5, 5],
        equations: ['dx/dt = y', 'dy/dt = -x + ax(1-z)', 'dz/dt = -bz + cxy'],
        step: function(x, y, z, h, p) {
            const dx = y;
            const dy = -x + p.a * x * (1 - z);
            const dz = -p.b * z + p.c * x * y;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Simple Lorenz with modified parameters - produces interesting variations
    modified_lorenz: {
        name: "Modified Lorenz",
        discoverer: "Various (Lorenz family)",
        description: "A variant of the classic Lorenz system with an additional nonlinear coupling term. Small parameter changes transform the butterfly wings into completely different topologies.",
        params: { sigma: 10, alpha: 26.0, c: 4, beta: 3, delta: 0.5 },
        defaults: { sigma: 10, alpha: 26, c: 4, beta: 3, delta: 0.5 },
        ranges: { sigma: [1, 30], alpha: [10, 50], c: [1, 10], beta: [0.5, 10], delta: [0.1, 3] },
        init: [0.1, 0, 0],
        bounds: [-30, 30, -30, 30, 0, 70],
        equations: ['dx/dt = σ(y-x) + δz', 'dy/dt = αx - y - xz', 'dz/dt = -cz + βxy'],
        step: function(x, y, z, h, p) {
            const dx = p.sigma * (y - x) + p.delta * z;
            const dy = p.alpha * x - y - x * z;
            const dz = -p.c * z + p.beta * x * y;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    }
};

// Additional attractors for visual diversity
const EXTRA_ATTRACTORS = {

    // The classic single-scroll - elegant spiral chaos
    rossler: {
        name: "Rossler",
        discoverer: "Otto Rossler (1976)",
        description: "A beautiful single-scroll attractor with a twisting spiral structure. Simpler than Lorenz but equally chaotic. Otto Rossler designed it as a minimal model for chemical oscillations.",
        params: { a: 0.2, b: 0.2, c: 5.7 },
        defaults: { a: 0.2, b: 0.2, c: 5.7 },
        ranges: { a: [0.01, 2], b: [0.01, 2], c: [1, 20] },
        init: [1.0, 0, 0],
        bounds: [-10, 10, -10, 10, 0, 10],
        equations: ['dx/dt = -(y + z)', 'dy/dt = x + ay', 'dz/dt = b + z(x - c)'],
        step: function(x, y, z, h, p) {
            const dx = -(y + z);
            const dy = x + p.a * y;
            const dz = p.b + z * (x - p.c);
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Three-scroll attractor - rare multi-basin chaos
    sparrow: {
        name: "Sparrow",
        discoverer: "Xin Zhang & Jiarui Wei (2009)",
        description: "A rare three-scroll chaotic attractor. Most chaotic systems have one or two basins - three is unusual. The structure resembles a flower with three petals.",
        params: { a: 5, b: 1.2, c: 2.1, d: 0.1, e: 4.2, f: 3.1 },
        defaults: { a: 5, b: 1.2, c: 2.1, d: 0.1, e: 4.2, f: 3.1 },
        ranges: { a: [1, 10], b: [0.1, 5], c: [0.5, 5], d: [0.01, 1], e: [1, 10], f: [1, 10] },
        init: [0.01, 0.01, 0.01],
        bounds: [-5, 5, -5, 5, -5, 5],
        equations: ['dx/dt = a(x-y)', 'dy/dt = -x + by + cz + dxy', 'dz/dt = -ex + fyz'],
        step: function(x, y, z, h, p) {
            const dx = p.a * (x - y);
            const dy = -x + p.b * y + p.c * z + p.d * x * y;
            const dz = -p.e * x + p.f * y * z;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // David Arnold attractor - beautiful flower-like structure
    david: {
        name: "David Arnold",
        discoverer: "David Arnold (2017)",
        description: "A modern attractor that produces gorgeous flower-like patterns. The sine/cosine coupling creates petal structures that rotate and morph with parameters.",
        params: { a: 0.1, b: 0.1, c: 0.1 },
        defaults: { a: 0.1, b: 0.1, c: 0.1 },
        ranges: { a: [0.01, 1], b: [0.01, 1], c: [0.01, 1] },
        init: [0.1, 0, 0],
        bounds: [-3, 3, -3, 3, -3, 3],
        equations: ['dx/dt = -ax + siny', 'dy/dt = -by + sinx', 'dz/dt = -cz + x'],
        step: function(x, y, z, h, p) {
            const dx = -p.a * x + Math.sin(y);
            const dy = -p.b * y + Math.sin(x);
            const dz = -p.c * z + x;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Hyperchaotic Lorenz-like system - 4D projected to 3D
    hyper_lorenz: {
        name: "Hyper Lorenz",
        discoverer: "Ueta & Haraguchi (2002)",
        description: "A four-dimensional extension of Lorenz projected to 3D. Hyperchaotic systems have multiple positive Lyapunov exponents, meaning chaos in multiple directions simultaneously.",
        params: { a: 10, b: 15, c: 28, d: 4, e: 1 },
        defaults: { a: 10, b: 15, c: 28, d: 4, e: 1 },
        ranges: { a: [1, 30], b: [1, 30], c: [10, 50], d: [0.1, 10], e: [0.1, 5] },
        init: [0.1, 0.1, 0.1],
        bounds: [-40, 40, -40, 40, -40, 40],
        equations: ['dx/dt = -a(x-y)', 'dy/dt = cx - ay - xz', 'dz/dt = -bz + xy'],
        step: function(x, y, z, h, p) {
            const dx = -p.a * (x - y);
            const dy = p.c * x - p.a * y - x * z;
            const dz = -p.b * z + x * y;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // Chen's attractor - looks like a figure-8 or infinity symbol
    chen: {
        name: "Chen",
        discoverer: "Guoji Chen (1999)",
        description: "Looks similar to Lorenz but with different topology. Chen discovered this by changing just one sign in the Lorenz equations. The resulting attractor has thicker, more complex loops.",
        params: { a: 35, b: 3, c: 28 },
        defaults: { a: 35, b: 3, c: 28 },
        ranges: { a: [10, 60], b: [0.5, 10], c: [10, 50] },
        init: [0.1, 0.1, 0.1],
        bounds: [-30, 30, -30, 30, 0, 30],
        equations: ['dx/dt = a(y-x)', 'dy/dt = -xz + cx', 'dz/dt = xy - bz'],
        step: function(x, y, z, h, p) {
            const dx = p.a * (y - x);
            const dy = -x * z + p.c * x;
            const dz = x * y - p.b * z;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    },

    // T-system - simple equations, beautiful butterfly
    t_system: {
        name: "T-System",
        discoverer: "Thomas (1981)",
        description: "An extremely simple system: dx/dt = sin(y), dy/dt = sin(z), dz/dt = sin(x). Only one parameter b acts as damping. Despite simplicity, produces beautiful triple-loop chaos.",
        params: { b: 0.208186 },
        defaults: { b: 0.208186 },
        ranges: { b: [0.1, 1.0] },
        init: [0.1, 0.1, 0.1],
        bounds: [-1.5, 1.5, -1.5, 1.5, -1.5, 1.5],
        equations: ['dx/dt = sin(y) - bx', 'dy/dt = sin(z) - by', 'dz/dt = sin(x) - bz'],
        step: function(x, y, z, h, p) {
            const dx = Math.sin(y) - p.b * x;
            const dy = Math.sin(z) - p.b * y;
            const dz = Math.sin(x) - p.b * z;
            return [x + dx * h, y + dy * h, z + dz * h];
        }
    }
};

// Merge extra attractors into main object
Object.assign(ATTRACTORS, EXTRA_ATTRACTORS);

// Poincare section calculator
class PoincareSection {
    constructor() {
        this.points = [];
        this.lastSign = 0;
        this.maxPoints = 5000;
    }

    reset() {
        this.points = [];
        this.lastSign = 0;
    }

    // Record intersection when trajectory crosses z=0 plane (going up)
    checkIntersection(prevZ, currZ, x, y) {
        if (this.lastSign === 0) {
            this.lastSign = Math.sign(currZ);
            return;
        }

        const currSign = Math.sign(currZ);
        if (currSign !== this.lastSign && currSign >= 0) {
            // Interpolated intersection point
            const t = prevZ / (prevZ - currZ);
            this.points.push([
                x + t * (x - x), // approximate x at crossing
                y + t * (y - y), // approximate y at crossing
                0
            ]);
            if (this.points.length > this.maxPoints) {
                this.points.shift();
            }
        }
        this.lastSign = currSign;
    }
}
// Simulation engine
class AttractorSimulation {
    constructor(attractorKey) {
        this.key = attractorKey;
        this.attractor = ATTRACTORS[attractorKey];
        this.params = { ...this.attractor.params };
        this.position = [...this.attractor.init];
        this.points = [];
        this.maxPoints = 20000;
        this.h = 0.005; // RK4 step size
        this.burnIn = 0; // points to discard (transient phase)
    }

    // Euler integration step with NaN/Infinity protection
    step() {
        const newPos = this.attractor.step(
            this.position[0], this.position[1], this.position[2],
            this.h, this.params
        );

        // Check for NaN/Infinity and reset if needed
        if (!isFinite(newPos[0]) || !isFinite(newPos[1]) || !isFinite(newPos[2])) {
            this.position = [...this.attractor.init];
            return;
        }

        this.position = newPos;
        this.points.push([...this.position]);
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }

    reset() {
        this.position = [...this.attractor.init];
        this.points = [];
        this.burnIn = 0;
        // Reset Lyapunov tracking
        this.lyapunovSum = 0;
        this.lyapunovCount = 0;
        this.perturbation = [1e-10, 1e-10, 1e-10];
    }

    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        this.reset();
    }

    runBurnIn(iterations = 5000) {
        this.reset(); // Initialize perturbation and Lyapunov tracking
        for (let i = 0; i < iterations; i++) {
            this.step();
        }
        this.burnIn = iterations;
    }

    // Calculate maximum Lyapunov exponent using perturbation method
    stepLyapunov() {
        // Step main trajectory
        this.step();

        // Step perturbed trajectory
        const perturbedPos = [
            this.position[0] + this.perturbation[0],
            this.position[1] + this.perturbation[1],
            this.position[2] + this.perturbation[2]
        ];

        const newPerturbedPos = this.attractor.step(
            perturbedPos[0], perturbedPos[1], perturbedPos[2],
            this.h, this.params
        );

        // Check for NaN/Infinity
        if (!isFinite(newPerturbedPos[0]) || !isFinite(newPerturbedPos[1]) || !isFinite(newPerturbedPos[2])) {
            this.perturbation = [1e-10, 1e-10, 1e-10];
            return;
        }

        // Calculate divergence
        this.perturbation = [
            newPerturbedPos[0] - this.position[0],
            newPerturbedPos[1] - this.position[1],
            newPerturbedPos[2] - this.position[2]
        ];

        const divergence = Math.sqrt(
            this.perturbation[0] ** 2 +
            this.perturbation[1] ** 2 +
            this.perturbation[2] ** 2
        );

        const targetDist = 1e-10;

        if (divergence > 1e-15 && divergence < 1e5) {
            this.lyapunovSum += Math.log(divergence / targetDist);
            this.lyapunovCount++;

            // Renormalize perturbation
            const scale = targetDist / divergence;
            this.perturbation[0] *= scale;
            this.perturbation[1] *= scale;
            this.perturbation[2] *= scale;
        }
    }

    getMaxLyapunovExponent() {
        if (this.lyapunovCount === 0) return 0;
        // Average Lyapunov exponent per unit time
        const totalTime = this.lyapunovCount * this.h;
        return this.lyapunovSum / totalTime;
    }
}
