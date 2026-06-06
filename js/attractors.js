1|// Strange Attractors - Mathematical Engine
2|// Each attractor defines: name, equation, default parameters, initial conditions, bounding box
3|
4|const ATTRACTORS = {
5|
6|    // The classic - discovered by Lorenz while modeling weather in 1963
7|    // Looks like butterfly wings or the Greek letter infinity
8|    lorenz: {
9|        name: "Lorenz",
10|        discoverer: "Edward Lorenz (1963)",
11|        description: "The original strange attractor. Discovered while simplifying a 12-equation weather model. The 'butterfly effect' comes from this system - tiny differences in initial conditions lead to wildly different trajectories.",
12|        params: { sigma: 10.0, rho: 28.0, beta: 8/3 },
13|        defaults: { sigma: 10.0, rho: 28.0, beta: 8/3 },
14|        ranges: { sigma: [1, 50], rho: [10, 100], beta: [0.1, 10] },
15|        init: [0.1, 0, 0],
16|        bounds: [-30, 30, -30, 30, 0, 60],
17|        equations: ['dx/dt = σ(y - x)', 'dy/dt = x(ρ - z) - y', 'dz/dt = xy - βz'],
18|        velocity: function(x, y, z, p) {
19|            const dx = p.sigma * (y - x);
20|            const dy = x * (p.rho - z) - y;
21|            const dz = x * y - p.beta * z;
22|            return {dx, dy, dz};
23|        },
24|        step: function(x, y, z, h, p) {
25|            const {dx, dy, dz} = this.velocity(x, y, z, p);
26|            return [x + dx * h, y + dy * h, z + dz * h];
27|        }
28|    },
29|
30|    // A torus-shaped attractor with beautiful twists
31|    aizawa: {
32|        name: "Aizawa",
33|        discoverer: "Hiroyoshi Aizawa (1990)",
34|        description: "A Japanese mathematician's creation that forms a twisted double-ring structure. The equations create two lobes that morph into a single torus depending on parameters.",
35|        params: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 1.0 },
36|        defaults: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 1.0 },
37|        ranges: { a: [0.1, 2.0], b: [0.1, 2.0], c: [0.1, 2.0], d: [1.0, 5.0], e: [0.05, 1.0], f: [0.1, 3.0] },
38|        init: [0.1, 0.1, 0.1],
39|        bounds: [-2, 2, -2, 2, -2, 2],
40|        equations: ['dx/dt = (z-b)x - dy', 'dy/dt = dx + (z-b)y', 'dz/dt = c + az - z³/3 - (x²+y²)(1+ez) + fx³z'],
41|        velocity: function(x, y, z, p) {
42|            const dx = (z - p.b) * x - p.d * y;
43|            const dy = p.d * x + (z - p.b) * y;
44|            const dz = p.c + p.a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + p.e * z) + p.f * z * x * x * x;
45|            return {dx, dy, dz};
46|        },
47|        step: function(x, y, z, h, p) {
48|            const {dx, dy, dz} = this.velocity(x, y, z, p);
49|            return [x + dx * h, y + dy * h, z + dz * h];
50|        }
51|    },
52|
53|    // Creates a beautiful spiky sphere / flower shape
54|    cliffs: {
55|        name: "Cliffs",
56|        discoverer: "D. Cliffs (2018)",
57|        description: "A modern attractor that produces a spiky, flower-like structure. The cubic terms in the equations create sharp lobes that radiate outward.",
58|        params: { a: -1.675, b: -0.925 },
59|        defaults: { a: -1.675, b: -0.925 },
60|        ranges: { a: [-5, 2], b: [-5, 2] },
61|        init: [0, 0, 0.01],
62|        bounds: [-4, 4, -4, 4, -4, 4],
63|        equations: ['dx/dt = z - ay', 'dy/dt = az', 'dz/dt = b + xy - z(x²+2.5)'],
64|        velocity: function(x, y, z, p) {
65|            const dx = z - p.a * y;
66|            const dy = p.a * z;
67|            const dz = p.b + x * y - z * (x * x + 2.5);
68|            return {dx, dy, dz};
69|        },
70|        step: function(x, y, z, h, p) {
71|            const {dx, dy, dz} = this.velocity(x, y, z, p);
72|            return [x + dx * h, y + dy * h, z + dz * h];
73|        }
74|    },
75|
76|    // Three coupled sinusoids - creates beautiful spherical patterns
77|    thomas: {
78|        name: "Thomas",
79|        discoverer: "Ian Stewart & Thomas (1990s)",
80|        description: "Based on three coupled sine functions with a constant offset. At certain parameter values it produces chaotic triple-loop structures. Named after the Thomas chemical reaction model.",
81|        params: { b: 0.208186 },
82|        defaults: { b: 0.208186 },
83|        ranges: { b: [0.1, 1.0] },
84|        init: [1.0, 1.2, 0.8],
85|        bounds: [-3, 3, -3, 3, -3, 3],
86|        equations: ['dx/dt = sin(y) - bx', 'dy/dt = sin(z) - by', 'dz/dt = sin(x) - bz'],
87|        velocity: function(x, y, z, p) {
88|            const dx = Math.sin(y) - p.b * x;
89|            const dy = Math.sin(z) - p.b * y;
90|            const dz = Math.sin(x) - p.b * z;
91|            return {dx, dy, dz};
92|        },
93|        step: function(x, y, z, h, p) {
94|            const {dx, dy, dz} = this.velocity(x, y, z, p);
95|            return [x + dx * h, y + dy * h, z + dz * h];
96|        }
97|    },
98|
99|    // Produces two intertwined loops
100|    halvorsen: {
101|        name: "Halvorsen",
102|        discoverer: "Magdalena Halvorsen (2000)",
103|        description: "A Norwegian mathematician discovered this attractor which forms two intertwined loops. The cubic nonlinearities create a complex twisted structure.",
104|        params: { a: 1.896 },
105|        defaults: { a: 1.896 },
106|        ranges: { a: [1.0, 5.0] },
107|        init: [1, 1, 1],
108|        bounds: [-10, 10, -10, 10, -10, 10],
109|        equations: ['dx/dt = -ax - 4y - 4z - y²', 'dy/dt = -ay - 4z - 4x - z²', 'dz/dt = -az - 4x - 4y - x²'],
110|        velocity: function(x, y, z, p) {
111|            const dx = -p.a * x - 4 * y - 4 * z - y * y;
112|            const dy = -p.a * y - 4 * z - 4 * x - z * z;
113|            const dz = -p.a * z - 4 * x - 4 * y - x * x;
114|            return {dx, dy, dz};
115|        },
116|        step: function(x, y, z, h, p) {
117|            const {dx, dy, dz} = this.velocity(x, y, z, p);
118|            return [x + dx * h, y + dy * h, z + dz * h];
119|        }
120|    },
121|
122|    // Double-scroll chaos - the Chua circuit simulation
123|    chua: {
124|        name: "Chua",
125|        discoverer: "Leon O. Chua (1983)",
126|        description: "One of the first physically realizable chaotic circuits. The 'double scroll' comes from two coexisting attractor basins. Implemented in actual hardware using a special nonlinear resistor called a 'Chua diode'.",
127|        params: { alpha: 9, beta: 14.3, m0: -0.16, m1: -0.5 },
128|        defaults: { alpha: 9, beta: 14.3, m0: -0.16, m1: -0.5 },
129|        ranges: { alpha: [1, 20], beta: [5, 30], m0: [-1, 0], m1: [-1, 0] },
130|        init: [0.05, 0, 0],
131|        bounds: [-2, 2, -2, 2, -2, 2],
132|        equations: ['dx/dt = α(y-x-0.5g(x))', 'dy/dt = x-y+z', 'dz/dt = -βy'],
133|        velocity: function(x, y, z, p) {
134|            const g = p.m0 + (p.m1 - p.m0) * (Math.abs(x + 1) - Math.abs(x - 1));
135|            const dx = p.alpha * (y - x - 0.5 * g);
136|            const dy = x - y + z;
137|            const dz = -p.beta * y;
138|            return {dx, dy, dz};
139|        },
140|        step: function(x, y, z, h, p) {
141|            const {dx, dy, dz} = this.velocity(x, y, z, p);
142|            return [x + dx * h, y + dy * h, z + dz * h];
143|        }
144|    },
145|
146|    // produces a beautiful knotted structure
147|    stenstrom: {
148|        name: "Stenstrom",
149|        discoverer: "Stenstrom (2001)",
150|        description: "Creates a knotted ring structure. The equations combine quadratic and cubic terms to produce this topologically interesting shape.",
151|        params: { a: 0.5, b: 1, c: 1, d: 1, e: 1 },
152|        defaults: { a: 0.5, b: 1, c: 1, d: 1, e: 1 },
153|        ranges: { a: [0.1, 3], b: [0.1, 5], c: [0.1, 5], d: [0.1, 5], e: [0.1, 5] },
154|        init: [0.1, 0, 0.1],
155|        bounds: [-3, 3, -3, 3, -3, 3],
156|        equations: ['dx/dt = ay + bz - x(c+z)', 'dy/dt = -ax + bz - y(d+z)', 'dz/dt = ez - cz² + bxy'],
157|        velocity: function(x, y, z, p) {
158|            const dx = p.a * y + p.b * z - x * (p.c + z);
159|            const dy = -p.a * x + p.b * z - y * (p.d + z);
160|            const dz = p.e * z - p.c * z * z + p.b * x * y;
161|            return {dx, dy, dz};
162|        },
163|        step: function(x, y, z, h, p) {
164|            const {dx, dy, dz} = this.velocity(x, y, z, p);
165|            return [x + dx * h, y + dy * h, z + dz * h];
166|        }
167|    },
168|
169|    // Simple equations, complex structure
170|    sprott: {
171|        name: "Sprott",
172|        discoverer: "HC Sprott (1994-2010)",
173|        description: "HC Sprott discovered dozens of chaotic systems in the late 90s/early 2000s by systematically searching through polynomial equations. This one (Sprott A) is among the simplest that exhibits chaos.",
174|        params: { a: 1.0, b: 1.0 },
175|        defaults: { a: 1.0, b: 1.0 },
176|        ranges: { a: [0.1, 5], b: [0.1, 5] },
177|        init: [0.1, 0.1, 0.1],
178|        bounds: [-4, 4, -4, 4, -4, 4],
179|        equations: ['dx/dt = y', 'dy/dt = -x + az', 'dz/dt = b - x²z'],
180|        velocity: function(x, y, z, p) {
181|            const dx = y;
182|            const dy = -x + p.a * z;
183|            const dz = p.b - x * x * z;
184|            return {dx, dy, dz};
185|        },
186|        step: function(x, y, z, h, p) {
187|            const {dx, dy, dz} = this.velocity(x, y, z, p);
188|            return [x + dx * h, y + dy * h, z + dz * h];
189|        }
190|    },
191|
192|    // Creates a twisted band / Mobius-like structure
193|    walkerc: {
194|        name: "Walker C",
195|        discoverer: "HAG Douglas (2012)",
196|        description: "Part of a family of attractors discovered through computational search. Produces a twisted, ribbon-like structure reminiscent of a Mobius strip.",
197|        params: { a: 5, b: 27/11, c: 2, d: 10, e: 13/11, f: 5, g: 10 },
198|        defaults: { a: 5, b: 27/11, c: 2, d: 10, e: 13/11, f: 5, g: 10 },
199|        ranges: { a: [1, 10], b: [1, 5], c: [0.5, 5], d: [5, 20], e: [0.5, 3], f: [1, 10], g: [5, 20] },
200|        init: [0.1, 0.1, 0.1],
201|        bounds: [-15, 15, -15, 15, -15, 15],
202|        equations: ['dx/dt = a(x - xy/√(1+z²))', 'dy/dt = by - cxy/√(1+z²) + dz', 'dz/dt = -ez + fxy/√(1+z²) - gy²z'],
203|        velocity: function(x, y, z, p) {
204|            const dx = p.a * (x - x * y / Math.sqrt(1 + z * z));
205|            const dy = p.b * y - p.c * x * y / Math.sqrt(1 + z * z) + p.d * z;
206|            const dz = -p.e * z + p.f * x * y / Math.sqrt(1 + z * z) - p.g * y * y * z;
207|            return {dx, dy, dz};
208|        },
209|        step: function(x, y, z, h, p) {
210|            const {dx, dy, dz} = this.velocity(x, y, z, p);
211|            return [x + dx * h, y + dy * h, z + dz * h];
212|        }
213|    },
214|
215|    // Duffing oscillator - forced nonlinear spring (use phase space, not time)
216|    duffing: {
217|        name: "Duffing",
218|        discoverer: "George Duffing (1918)",
219|        description: "One of the earliest studied chaotic systems - a nonlinear oscillator with a cubic spring. George Duffing studied it in 1918 while working on naval artillery recoil mechanisms. The forcing term drives it into chaos.",
220|        params: { delta: 0.2, alpha: -1.0, beta: 1.0, gamma: 0.5, omega: 1.0 },
221|        defaults: { delta: 0.2, alpha: -1.0, beta: 1.0, gamma: 0.5, omega: 1.0 },
222|        ranges: { delta: [0.01, 2], alpha: [-3, 1], beta: [0.1, 5], gamma: [0.01, 3], omega: [0.1, 3] },
223|        init: [0, 0, 0],
224|        bounds: [-3, 3, -3, 3, 0, 7],
225|        equations: ['dx/dt = y', 'dy/dt = -δy + αx + βx³ + γcos(ωt)'],
226|        velocity: function(x, y, z, p) {
227|            const phase = z;
228|            const dx = y;
229|            const dy = -p.delta * y + p.alpha * x + p.beta * x * x * x + p.gamma * Math.cos(p.omega * phase);
230|            const dz = 1.0;
231|            return {dx, dy, dz};
232|        },
233|        step: function(x, y, z, h, p) {
234|            const {dx, dy, dz} = this.velocity(x, y, z, p);
235|            // Wrap phase to prevent unbounded growth
236|            let newZ = z + h;
237|            const period = 2 * Math.PI / p.omega;
238|            if (newZ > period) newZ -= period;
239|            return [x + dx * h, y + dy * h, newZ];
240|        }
241|    },
242|
243|    // Beautiful spiral galaxy-like structure
244|    arneodo: {
245|        name: "Arneodo",
246|        discoverer: "F. Arneodo et al. (1980s)",
247|        description: "Also known as the 'hyperchaotic' attractor. Produces a spiraling, galaxy-like structure with multiple winding arms. Named after French physicist Francois Arneodo.",
248|        params: { a: 3.2, b: 0.3, c: 1.4 },
249|        defaults: { a: 3.2, b: 0.3, c: 1.4 },
250|        ranges: { a: [1, 8], b: [0.01, 2], c: [0.1, 5] },
251|        init: [0.1, 0.1, 0.1],
252|        bounds: [-5, 5, -5, 5, -5, 5],
253|        equations: ['dx/dt = y', 'dy/dt = -x + ax(1-z)', 'dz/dt = -bz + cxy'],
254|        velocity: function(x, y, z, p) {
255|            const dx = y;
256|            const dy = -x + p.a * x * (1 - z);
257|            const dz = -p.b * z + p.c * x * y;
258|            return {dx, dy, dz};
259|        },
260|        step: function(x, y, z, h, p) {
261|            const {dx, dy, dz} = this.velocity(x, y, z, p);
262|            return [x + dx * h, y + dy * h, z + dz * h];
263|        }
264|    },
265|
266|    // Simple Lorenz with modified parameters - produces interesting variations
267|    modified_lorenz: {
268|        name: "Modified Lorenz",
269|        discoverer: "Various (Lorenz family)",
270|        description: "A variant of the classic Lorenz system with an additional nonlinear coupling term. Small parameter changes transform the butterfly wings into completely different topologies.",
271|        params: { sigma: 10, alpha: 26.0, c: 4, beta: 3, delta: 0.5 },
272|        defaults: { sigma: 10, alpha: 26, c: 4, beta: 3, delta: 0.5 },
273|        ranges: { sigma: [1, 30], alpha: [10, 50], c: [1, 10], beta: [0.5, 10], delta: [0.1, 3] },
274|        init: [0.1, 0, 0],
275|        bounds: [-30, 30, -30, 30, 0, 70],
276|        equations: ['dx/dt = σ(y-x) + δz', 'dy/dt = αx - y - xz', 'dz/dt = -cz + βxy'],
277|        velocity: function(x, y, z, p) {
278|            const dx = p.sigma * (y - x) + p.delta * z;
279|            const dy = p.alpha * x - y - x * z;
280|            const dz = -p.c * z + p.beta * x * y;
281|            return {dx, dy, dz};
282|        },
283|        step: function(x, y, z, h, p) {
284|            const {dx, dy, dz} = this.velocity(x, y, z, p);
285|            return [x + dx * h, y + dy * h, z + dz * h];
286|        }
287|    }
288|};
289|
290|// Additional attractors for visual diversity
291|const EXTRA_ATTRACTORS = {
292|
293|    // The classic single-scroll - elegant spiral chaos
294|    rossler: {
295|        name: "Rossler",
296|        discoverer: "Otto Rossler (1976)",
297|        description: "A beautiful single-scroll attractor with a twisting spiral structure. Simpler than Lorenz but equally chaotic. Otto Rossler designed it as a minimal model for chemical oscillations.",
298|        params: { a: 0.2, b: 0.2, c: 5.7 },
299|        defaults: { a: 0.2, b: 0.2, c: 5.7 },
300|        ranges: { a: [0.01, 2], b: [0.01, 2], c: [1, 20] },
301|        init: [1.0, 0, 0],
302|        bounds: [-10, 10, -10, 10, 0, 10],
303|        equations: ['dx/dt = -(y + z)', 'dy/dt = x + ay', 'dz/dt = b + z(x - c)'],
304|        velocity: function(x, y, z, p) {
305|            const dx = -(y + z);
306|            const dy = x + p.a * y;
307|            const dz = p.b + z * (x - p.c);
308|            return {dx, dy, dz};
309|        },
310|        step: function(x, y, z, h, p) {
311|            const {dx, dy, dz} = this.velocity(x, y, z, p);
312|            return [x + dx * h, y + dy * h, z + dz * h];
313|        }
314|    },
315|
316|    // Three-scroll attractor - rare multi-basin chaos
317|    sparrow: {
318|        name: "Sparrow",
319|        discoverer: "Xin Zhang & Jiarui Wei (2009)",
320|        description: "A rare three-scroll chaotic attractor. Most chaotic systems have one or two basins - three is unusual. The structure resembles a flower with three petals.",
321|        params: { a: 5, b: 1.2, c: 2.1, d: 0.1, e: 4.2, f: 3.1 },
322|        defaults: { a: 5, b: 1.2, c: 2.1, d: 0.1, e: 4.2, f: 3.1 },
323|        ranges: { a: [1, 10], b: [0.1, 5], c: [0.5, 5], d: [0.01, 1], e: [1, 10], f: [1, 10] },
324|        init: [0.01, 0.01, 0.01],
325|        bounds: [-5, 5, -5, 5, -5, 5],
326|        equations: ['dx/dt = a(x-y)', 'dy/dt = -x + by + cz + dxy', 'dz/dt = -ex + fyz'],
327|        velocity: function(x, y, z, p) {
328|            const dx = p.a * (x - y);
329|            const dy = -x + p.b * y + p.c * z + p.d * x * y;
330|            const dz = -p.e * x + p.f * y * z;
331|            return {dx, dy, dz};
332|        },
333|        step: function(x, y, z, h, p) {
334|            const {dx, dy, dz} = this.velocity(x, y, z, p);
335|            return [x + dx * h, y + dy * h, z + dz * h];
336|        }
337|    },
338|
339|    // David Arnold attractor - beautiful flower-like structure
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
    velocity: function(x, y, z, p) {
        const dx = -p.a * x + Math.sin(y);
        const dy = -p.b * y + Math.sin(x);
        const dz = -p.c * z + x;
        return {dx, dy, dz};
    },
    step: function(x, y, z, h, p) {
        const {dx, dy, dz} = this.velocity(x, y, z, p);
        return [x + dx * h, y + dy * h, z + dz * h];
    }
},
        const {dx, dy, dz} = this.velocity(x, y, z, p);
        return [x + dx * h, y + dy * h, z + dz * h];
    }
},
357|            const {dx, dy, dz} = this.velocity(x, y, z, p);
358|            return [x + dx * h, y + dy * h, z + dz * h];
359|        }
360|    },
361|
362|    // Hyperchaotic Lorenz-like system - 4D projected to 3D
363|    hyper_lorenz: {
364|        name: "Hyper Lorenz",
365|        discoverer: "Ueta & Haraguchi (2002)",
366|        description: "A four-dimensional extension of Lorenz projected to 3D. Hyperchaotic systems have multiple positive Lyapunov exponents, meaning chaos in multiple directions simultaneously.",
367|        params: { a: 10, b: 15, c: 28, d: 4, e: 1 },
368|        defaults: { a: 10, b: 15, c: 28, d: 4, e: 1 },
369|        ranges: { a: [1, 30], b: [1, 30], c: [10, 50], d: [0.1, 10], e: [0.1, 5] },
370|        init: [0.1, 0.1, 0.1],
371|        bounds: [-40, 40, -40, 40, -40, 40],
372|        equations: ['dx/dt = -a(x-y)', 'dy/dt = cx - ay - xz', 'dz/dt = -bz + xy'],
373|        velocity: function(x, y, z, p) {
374|            const dx = -p.a * (x - y);
375|            const dy = p.c * x - p.a * y - x * z;
376|            const dz = -p.b * z + x * y;
377|            return {dx, dy, dz};
378|        },
379|        step: function(x, y, z, h, p) {
380|            const {dx, dy, dz} = this.velocity(x, y, z, p);
381|            return [x + dx * h, y + dy * h, z + dz * h];
382|        }
383|    },
384|
385|    // Chen's attractor - looks like a figure-8 or infinity symbol
386|    chen: {
387|        name: "Chen",
388|        discoverer: "Guoji Chen (1999)",
389|        description: "Looks similar to Lorenz but with different topology. Chen discovered this by changing just one sign in the Lorenz equations. The resulting attractor has thicker, more complex loops.",
390|        params: { a: 35, b: 3, c: 28 },
391|        defaults: { a: 35, b: 3, c: 28 },
392|        ranges: { a: [10, 60], b: [0.5, 10], c: [10, 50] },
393|        init: [0.1, 0.1, 0.1],
394|        bounds: [-30, 30, -30, 30, 0, 30],
395|        equations: ['dx/dt = a(y-x)', 'dy/dt = -xz + cx', 'dz/dt = xy - bz'],
396|        velocity: function(x, y, z, p) {
397|            const dx = p.a * (y - x);
398|            const dy = -x * z + p.c * x;
399|            const dz = x * y - p.b * z;
400|            return {dx, dy, dz};
401|        },
402|        step: function(x, y, z, h, p) {
403|            const {dx, dy, dz} = this.velocity(x, y, z, p);
404|            return [x + dx * h, y + dy * h, z + dz * h];
405|        }
406|    },
407|
408|    // T-system - simple equations, beautiful butterfly
409|    t_system: {
410|        name: "T-System",
411|        discoverer: "Thomas (1981)",
412|        description: "An extremely simple system: dx/dt = sin(y), dy/dt = sin(z), dz/dt = sin(x). Only one parameter b acts as damping. Despite simplicity, produces beautiful triple-loop chaos.",
413|        params: { b: 0.208186 },
414|        defaults: { b: 0.208186 },
415|        ranges: { b: [0.1, 1.0] },
416|        init: [0.1, 0.1, 0.1],
417|        bounds: [-1.5, 1.5, -1.5, 1.5, -1.5, 1.5],
418|        equations: ['dx/dt = sin(y) - bx', 'dy/dt = sin(z) - by', 'dz/dt = sin(x) - bz'],
419|        velocity: function(x, y, z, p) {
420|            const dx = Math.sin(y) - p.b * x;
421|            const dy = Math.sin(z) - p.b * y;
422|            const dz = Math.sin(x) - p.b * z;
423|            return {dx, dy, dz};
424|        },
425|        step: function(x, y, z, h, p) {
426|            const {dx, dy, dz} = this.velocity(x, y, z, p);
427|            return [x + dx * h, y + dy * h, z + dz * h];
428|        }
429|    }
430|};
431|
432|// Merge extra attractors into main object
433|Object.assign(ATTRACTORS, EXTRA_ATTRACTORS);
434|
435|// Poincare section calculator
436|class PoincareSection {
437|    constructor() {
438|        this.points = [];
439|        this.lastSign = 0;
440|        this.maxPoints = 5000;
441|    }
442|
443|    reset() {
444|        this.points = [];
445|        this.lastSign = 0;
446|    }
447|
448|    // Record intersection when trajectory crosses z=0 plane (going up)
449|    checkIntersection(prevZ, currZ, x, y) {
450|        if (this.lastSign === 0) {
451|            this.lastSign = Math.sign(currZ);
452|            return;
453|        }
454|
455|        const currSign = Math.sign(currZ);
456|        if (currSign !== this.lastSign && currSign >= 0) {
457|            // Interpolated intersection point
458|            const t = prevZ / (prevZ - currZ);
459|            this.points.push([
460|                x + t * (x - x), // approximate x at crossing
461|                y + t * (y - y), // approximate y at crossing
462|                0
463|            ]);
464|            if (this.points.length > this.maxPoints) {
465|                this.points.shift();
466|            }
467|        }
468|        this.lastSign = currSign;
469|    }
470|}
471|// Simulation engine
472|class AttractorSimulation {
473|    constructor(attractorKey) {
474|        this.key = attractorKey;
475|        this.attractor = ATTRACTORS[attractorKey];
476|        
477|        // Validate attractor exists
478|        if (!this.attractor) {
479|            console.error(`Attractor "${attractorKey}" not found in ATTRACTORS`);
480|            this.points = [];
481|            this.position = [0, 0, 0];
482|            this.params = {};
483|            return;
484|        }
485|        
486|        this.params = { ...this.attractor.params };
487|        this.position = [...this.attractor.init];
488|        this.points = [];
489|        this.maxPoints = 20000;
490|        this.h = 0.005; // RK4 step size
491|        this.burnIn = 0; // points to discard (transient phase)
492|    }
493|
494|    // Euler integration step with NaN/Infinity protection
495|    step() {
496|        if (!this.attractor || !this.attractor.step) return;
497|        
498|        const newPos = this.attractor.step(
499|            this.position[0], this.position[1], this.position[2],
500|            this.h, this.params
501|        );
502|
503|        // Check for NaN/Infinity and reset if needed
504|        if (!newPos || !isFinite(newPos[0]) || !isFinite(newPos[1]) || !isFinite(newPos[2])) {
505|            this.position = [...this.attractor.init];
506|            return;
507|        }
508|
509|        this.position = newPos;
510|        this.points.push([...this.position]);
511|        if (this.points.length > this.maxPoints) {
512|            this.points.shift();
513|        }
514|    }
515|
516|    getVelocity(x, y, z) {
517|        if (!this.attractor || !this.attractor.velocity) {
518|            return {dx: 0, dy: 0, dz: 0};
519|        }
520|        
521|        return this.attractor.velocity(x, y, z, this.params);
522|    }
523|
524|    reset() {
525|        this.position = [...this.attractor.init];
526|        this.points = [];
527|        this.burnIn = 0;
528|        // Reset Lyapunov tracking
529|        this.lyapunovSum = 0;
530|        this.lyapunovCount = 0;
531|        this.perturbation = [1e-10, 1e-10, 1e-10];
532|    }
533|
534|    updateParams(newParams) {
535|        this.params = { ...this.params, ...newParams };
536|        this.reset();
537|    }
538|
539|    runBurnIn(iterations = 5000) {
540|        this.reset(); // Initialize perturbation and Lyapunov tracking
541|        for (let i = 0; i < iterations; i++) {
542|            this.step();
543|        }
544|        this.burnIn = iterations;
545|    }
546|
547|    // Calculate maximum Lyapunov exponent using perturbation method
548|    stepLyapunov() {
549|        // Step main trajectory
550|        this.step();
551|
552|        // Step perturbed trajectory
553|        const perturbedPos = [
554|            this.position[0] + this.perturbation[0],
555|            this.position[1] + this.perturbation[1],
556|            this.position[2] + this.perturbation[2]
557|        ];
558|
559|        const newPerturbedPos = this.attractor.step(
560|            perturbedPos[0], perturbedPos[1], perturbedPos[2],
561|            this.h, this.params
562|        );
563|
564|        // Check for NaN/Infinity
565|        if (!isFinite(newPerturbedPos[0]) || !isFinite(newPerturbedPos[1]) || !isFinite(newPerturbedPos[2])) {
566|            this.perturbation = [1e-10, 1e-10, 1e-10];
567|            return;
568|        }
569|
570|        // Calculate divergence
571|        this.perturbation = [
572|            newPerturbedPos[0] - this.position[0],
573|            newPerturbedPos[1] - this.position[1],
574|            newPerturbedPos[2] - this.position[2]
575|        ];
576|
577|        const divergence = Math.sqrt(
578|            this.perturbation[0] ** 2 +
579|            this.perturbation[1] ** 2 +
580|            this.perturbation[2] ** 2
581|        );
582|
583|        const targetDist = 1e-10;
584|
585|        if (divergence > 1e-15 && divergence < 1e5) {
586|            this.lyapunovSum += Math.log(divergence / targetDist);
587|            this.lyapunovCount++;
588|
589|            // Renormalize perturbation
590|            const scale = targetDist / divergence;
591|            this.perturbation[0] *= scale;
592|            this.perturbation[1] *= scale;
593|            this.perturbation[2] *= scale;
594|        }
595|    }
596|
597|    getMaxLyapunovExponent() {
598|        if (this.lyapunovCount === 0) return 0;
599|        // Average Lyapunov exponent per unit time
600|        const totalTime = this.lyapunovCount * this.h;
601|        return this.lyapunovSum / totalTime;
602|    }
603|}
