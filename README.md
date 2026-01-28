# Animated Radial Gradient BG – Arc Footer

This demo reproduces the **Arc site footer gradient** exactly: the canvas-based radial color animation and black edge overlay from `AnimatedGradient.tsx`.

- **Same behavior:** 9s color cycle (purple → salmon → tangerine → blue), colors beam from center outward, black fades in from the edges.
- **Same layout:** Canvas positioned at bottom center, 130vw × 85vh, min height 650px; on mobile it scales 2× (like Arc’s `.footer-gradient-canvas`).
- **No dependencies:** Plain HTML, CSS, and JS. Open `index.html` or serve this folder.

The script is a direct port of the Arc `AnimatedGradient` component logic to vanilla JS.
