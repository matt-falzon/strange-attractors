# Strange Attractors

Interactive WebGL visualization of chaotic dynamical systems.

## What It Is

A browser-based exploration tool for strange attractors -- deterministic systems that produce complex, fractal-like structures. Includes 14 different attractors from the Lorenz system (1963) to modern discoveries, rendered in real-time as 3D point clouds.

## Attractors

| Attractor | Discoverer | Year |
|---|---|---|
| Lorenz | Edward Lorenz | 1963 |
| Rossler | Otto Rossler | 1976 |
| Aizawa | Hiroyoshi Aizawa | 1990 |
| Thomas | Ian Stewart & Thomas | 1990 |
| Sprott | HC Sprott | 1994 |
| Chua | Leon O. Chua | 1983 |
| Chen | Guoji Chen | 1999 |
| Halvorsen | Magdalena Halvorsen | 2000 |
| Stenstrom | Stenstrom | 2001 |
| Sparrow | Xin Zhang & Jiarui Wei | 2009 |
| Walker C | HAG Douglas | 2012 |
| David Arnold | David Arnold | 2017 |
| Cliffs | D. Cliffs | 2018 |
| Hyper Lorenz | Ueta & Haraguchi | 2002 |

## Requirements

Any modern browser with WebGL support (Chrome, Firefox, Safari, Edge).

No build step, no dependencies, no server required.

## Usage

### Quick Start

Just open `index.html` in a browser:

```bash
open index.html
```

Or serve it locally for best results:

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .

# Then open http://localhost:8080
```

### Controls

**Camera:**
- Click and drag to orbit
- Scroll wheel to zoom in/out
- Touch: one finger to orbit, pinch to zoom
- WASD: move camera forward/left/back/right
- Q/E: move camera up/down
- Home: reset camera to default position

**Panels:**
- Left panel: list of attractors, click to switch
- Right panel: parameter sliders, color palettes, rendering options
- Bottom bar: live stats (point count, Lyapunov exponent, FPS)
- Toggle equation/description view with buttons at bottom

**Parameters:**
- Adjust any parameter slider to modify the attractor in real-time
- Each attractor shows its differential equations below the visualization
- Click Reset Parameters to return to defaults

**Color Palettes:**
- 7 palettes: Hot, Ocean, Fire, Neon, Aurora, Ice, Galaxy
- Click any color circle in the right panel

**Rendering Options:**
- Point Size: adjust point cloud density (0.5 - 6.0)
- Trail Length: show trajectory connections between points
- Symmetry: apply 4-way, 6-way, or kaleidoscope symmetry
- Velocity Coloring: color points by trajectory speed instead of position

**Parameter Animation:**
- Select a parameter from the dropdown to animate it over time
- Adjust speed slider to control animation rate
- Press Play/Pause to start/stop the animation

**Keyboard Shortcuts:**
- `WASD` - Move camera
- `Q/E` - Move camera up/down
- `Home` - Reset camera
- `S` - Take screenshot (downloads PNG)
- `Space` - Pause/Resume simulation
- `R` - Random attractor

## How It Works

The simulation uses Euler integration with a small step size (h=0.005) to solve the differential equations numerically. Each attractor defines:

- `step(x, y, z, h, params)` -- one integration step returning new position
- `init` -- starting conditions [x0, y0, z0]
- `params` -- system parameters with adjustable ranges

The renderer uses WebGL for GPU-accelerated point cloud rendering with:
- Cosine palette color functions (Inigo Quilez's IQ palettes)
- Point glow effect via distance from point center
- Optional trail lines showing trajectory connections

### Lyapunov Exponent

The visualization calculates the maximum Lyapunov exponent in real-time using the perturbation method. A positive value indicates chaotic behavior -- nearby trajectories diverge exponentially over time. This is shown in the stats bar at the bottom.

## Structure

```
strange-attractors/
├── index.html      # Entry point, UI, styling
├── js/
│   ├── app.js          # Application logic, controls, events
│   ├── attractors.js   # Mathematical engine, all attractor definitions
│   ├── bifurcation.js  # Bifurcation diagram calculator
│   └── renderer.js     # WebGL point cloud + trail renderer
```

## License

MIT
