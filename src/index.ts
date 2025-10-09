import { instantiateStreaming } from '@assemblyscript/loader';
import { Logger } from './logger';
import { Keyboard } from './keyboard';

function noop() {}

type DoomExports = {
  /**
   * Adds a browser keyboard event to DOOM's event queue
   * @param type Event type (0 = KeyDown, 1 = KeyUp) - note: typo preserved from original WASM
   * @param keyCode DOOM-compatible key code
   */
  add_browser_event(type: number, keyCode: number): void;

  /**
   * Executes one iteration of the DOOM game loop
   * Should be called each frame via requestAnimationFrame
   */
  doom_loop_step(): void;

  /**
   * Initializes and starts the DOOM game
   * Must be called once before doom_loop_step
   */
  main(): void;
};

type OnPixelRenderEvent = {
  /** X coordinate of the pixel */
  x: number;
  /** Y coordinate of the pixel */
  y: number;
  /** Red color component (0-255) */
  r: number;
  /** Green color component (0-255) */
  g: number;
  /** Blue color component (0-255) */
  b: number;
  /** Alpha transparency component (0-255) */
  a: number;
};

type OnFrameRenderEvent = {
  screen: Uint8ClampedArray<ArrayBuffer>;
};

type Options = {
  /** Height of the output screen in pixels */
  screenHeight: number;
  /** Width of the output screen in pixels */
  screenWidth: number;
  /** Optional custom URL to the DOOM WASM binary */
  wasmURL?: string;
  /** Optional target for listening to keyboard events */
  keyboardTarget?: HTMLElement;
  /** Optional logs enabler */
  enableLogs?: boolean;
  /** Callback function invoked for each pixel when rendering a frame */
  onPixelRender?(event: OnPixelRenderEvent): void;
  /** Callback function invoked for each frame render */
  onFrameRender?(event: OnFrameRenderEvent): void;
};

/**
 * Main class for running DOOM
 *
 * @example
 * ```ts
 * const doom = new Doom({
 *   screenWidth: 320,
 *   screenHeight: 200,
 *   onFrame: ({ x, y, r, g, b, a }) => {
 *     // Handle pixel rendering
 *   }
 * });
 * await doom.start();
 * ```
 */
export class DOOM {
  /** Native DOOM render width */
  private doomWidth = 640 as const;
  /** Native DOOM render height */
  private doomHeight = 400 as const;
  /** URL to the DOOM WASM binary */
  private wasmURL = 'https://cdn.jsdelivr.net/npm/wasm-doom/wasm/doom.wasm';

  /** WebAssembly memory shared between JS and WASM (108 pages = ~6.9MB) */
  private memory = new WebAssembly.Memory({ initial: 108 });
  /** Logger instance for handling WASM console output */
  private logger: Logger | null = null;
  /** Keyboard handler for game input */
  private keyboard: Keyboard;

  /** Target screen height for rendered output */
  private screenHeight: number;
  /** Target screen width for rendered output */
  private screenWidth: number;
  /** Callback function invoked for each pixel when rendering a frame */
  private onPixelRender?: (event: OnPixelRenderEvent) => void;
  /** Callback function invoked for each frame render */
  private onFrameRender?: (event: OnFrameRenderEvent) => void;

  constructor(options: Options) {
    this.screenHeight = options.screenHeight;
    this.screenWidth = options.screenWidth;
    this.onPixelRender = options.onPixelRender;
    this.onFrameRender = options.onFrameRender;
    this.keyboard = new Keyboard(options.keyboardTarget);
    if (options.wasmURL) {
      this.wasmURL = options.wasmURL;
    }
    if (options.enableLogs) {
      this.logger = new Logger(this.memory);
    }
  }

  /** Returns the current timestamp in milliseconds (for game timing) */
  private getMilliseconds = () => {
    return performance.now();
  };

  /** Loads and instantiates the DOOM WebAssembly module */
  private async loadGame() {
    const game = await instantiateStreaming<DoomExports>(fetch(this.wasmURL), {
      js: {
        js_console_log: this.logger ? this.logger.getMethod('log') : noop,
        js_stdout: this.logger ? this.logger.getMethod('info') : noop,
        js_stderr: this.logger ? this.logger.getMethod('error') : noop,
        js_draw_screen: this.render,
        js_milliseconds_since_start: this.getMilliseconds,
      },
      env: {
        memory: this.memory,
      },
    });

    return game;
  }

  /** Renders a frame from WASM memory buffer */
  private render = (offest: number) => {
    const screen = new Uint8ClampedArray(this.memory.buffer, offest, this.doomWidth * this.doomHeight * 4);

    // Render by pixel
    if (this.onPixelRender) {
      // Downsample the native 640x400 DOOM resolution to the configured screen size
      // by reading every other pixel (2x2 sampling)
      for (let y = 0; y < this.screenHeight; y++) {
        for (let x = 0; x < this.screenWidth; x++) {
          const doomX = x * 2;
          const doomY = y * 2;
          const pixelIndex = (doomY * this.doomWidth + doomX) * 4;

          const r = screen[pixelIndex] || 0;
          const g = screen[pixelIndex + 1] || 0;
          const b = screen[pixelIndex + 2] || 0;
          const a = screen[pixelIndex + 3] || 0;

          this.onPixelRender({ x, y, r, g, b, a });
        }
      }
    }

    // Render by frame
    if (this.onFrameRender) {
      this.onFrameRender({ screen });
    }
  };

  /** Initializes and starts the DOOM game */
  public async start() {
    // Load game
    const game = await this.loadGame();

    // Bind keyboard events
    this.keyboard.bindKeyDown((keyCode) => game.exports.add_browser_event(0 /* KeyDown */, keyCode));
    this.keyboard.bindKeyUp((keyCode) => game.exports.add_browser_event(1 /* KeyUp */, keyCode));

    // Start game
    game.exports.main();
    const step = () => {
      game.exports.doom_loop_step();
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
}
