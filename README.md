# DOOM WASM Renderer

A typescript renderer module for running [DOOM](https://github.com/id-Software/DOOM) as WebAssembly in the browser.

Load the game and render it however you want — to Canvas, DOM elements, or any custom implementation.

Includes built-in keyboard handling and optional logging.

Based on the awesome [WebAssembly from Scratch: From FizzBuzz to DooM](https://github.com/diekmann/wasm-fizzbuzz/) project.

## Installation

```sh
bun add -D wasm-doom
# or
npm install -D wasm-doom
# or
yarn add -D wasm-doom
```

## Usage

### Canvas Rendering

The most performant way to render DOOM using the Canvas API:

```ts
import { DOOM } from "wasm-doom";

const screenWidth = 640;
const screenHeight = 400;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = screenWidth;
canvas.height = screenHeight;

const game = new DOOM({
  screenWidth,
  screenHeight,
  enableLogs: true,
  onFrameRender: ({ screen }) => {
    const frame = new ImageData(screen, screenWidth, screenHeight);
    ctx.putImageData(frame, 0, 0);
  },
});

await game.start();
```

### Pixel-by-Pixel Rendering

For custom rendering implementations where you need individual pixel control:

```ts
import { DOOM } from "wasm-doom";

const game = new DOOM({
  screenWidth: 320,
  screenHeight: 200,
  onPixelRender: ({ x, y, r, g, b, a }) => {
    // Your custom pixel rendering logic
    const pixel = getPixelAt(x, y);
    pixel.changeColor(`rgba(${r}, ${g}, ${b}, ${a})`);
  },
});

await game.start();
```

## API

### Constructor Options

```ts
new DOOM({
  screenWidth: number;              // Width of the output screen in pixels
  screenHeight: number;             // Height of the output screen in pixels
  wasmURL?: string;                 // Optional custom URL to DOOM WASM binary (default: jsDelivr CDN)
  keyboardTarget?: HTMLElement;     // Optional target element for keyboard events
  enableLogs?: boolean;             // Enable WASM console output (default: false)
  onPixelRender?: (event) => void;  // Per-pixel render callback
  onFrameRender?: (event) => void;  // Per-frame render callback
})
```

### Render Callbacks

**onPixelRender**: Called for each pixel during rendering

```ts
{
  x: number; // X coordinate (0 to screenWidth-1)
  y: number; // Y coordinate (0 to screenHeight-1)
  r: number; // Red component (0-255)
  g: number; // Green component (0-255)
  b: number; // Blue component (0-255)
  a: number; // Alpha component (0-255)
}
```

**onFrameRender**: Called once per frame with complete screen buffer

```ts
{
  screen: Uint8ClampedArray; // RGBA pixel data (width * height * 4 bytes)
}
```

### Methods

**start()**: Initializes and starts the game loop

```ts
await game.start();
```

## Examples

See the [example](./example) directory for working demonstrations:

- **canvas.html** — Canvas rendering
- **divs.html** — DOM-based rendering

Run examples locally:

```sh
bun run dev
```

## Credits

- **DOOM** — Originally created by [id Software](https://github.com/id-Software/DOOM) (1993)
- **WebAssembly port** — Based on [WebAssembly from Scratch: From FizzBuzz to DooM](https://github.com/diekmann/wasm-fizzbuzz/) by Cornelius Diekmann
