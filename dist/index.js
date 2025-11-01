// src/logger.ts
class Logger {
  memory;
  constructor(memory) {
    this.memory = memory;
  }
  readWasmString = (offset, length) => {
    const bytes = new Uint8Array(this.memory.buffer, offset, length);
    return new TextDecoder("utf8").decode(bytes);
  };
  getMethod = (method) => {
    return (offset, length) => {
      const lines = this.readWasmString(offset, length).split(`
`);
      for (let i = 0;i < lines.length; ++i) {
        if (lines[i]?.length === 0) {
          continue;
        }
        console[method](lines[i]);
      }
    };
  };
}

// src/keyboard.ts
class Keyboard {
  target;
  constructor(target = document.documentElement) {
    this.target = target;
  }
  bindKeyDown = (callback) => {
    this.target.addEventListener("keydown", (e) => {
      callback(this.mapDoomKeyCode(e.keyCode));
      e.preventDefault();
    }, false);
  };
  bindKeyUp = (callback) => {
    this.target.addEventListener("keyup", (e) => {
      callback(this.mapDoomKeyCode(e.keyCode));
      e.preventDefault();
    }, false);
  };
  mapDoomKeyCode = (keyCode) => {
    switch (keyCode) {
      case 8:
        return 127;
      case 17:
        return 128 + 29;
      case 18:
        return 128 + 56;
      case 37:
        return 172;
      case 38:
        return 173;
      case 39:
        return 174;
      case 40:
        return 175;
      default:
        if (keyCode >= 65 && keyCode <= 90) {
          return keyCode + 32;
        }
        if (keyCode >= 112 && keyCode <= 123) {
          return keyCode + 75;
        }
        return keyCode;
    }
  };
}

// src/index.ts
function noop() {}

class DOOM {
  doomWidth = 640;
  doomHeight = 400;
  wasmURL = "https://cdn.jsdelivr.net/npm/wasm-doom/wasm/doom.wasm";
  memory = new WebAssembly.Memory({ initial: 108 });
  logger = null;
  keyboard;
  screenHeight;
  screenWidth;
  onPixelRender;
  onFrameRender;
  constructor(options) {
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
  getMilliseconds = () => {
    return performance.now();
  };
  async loadGame() {
    const game = await WebAssembly.instantiateStreaming(fetch(this.wasmURL), {
      js: {
        js_console_log: this.logger ? this.logger.getMethod("log") : noop,
        js_stdout: this.logger ? this.logger.getMethod("info") : noop,
        js_stderr: this.logger ? this.logger.getMethod("error") : noop,
        js_draw_screen: this.render,
        js_milliseconds_since_start: this.getMilliseconds
      },
      env: {
        memory: this.memory
      }
    });
    return game;
  }
  render = (offest) => {
    const screen = new Uint8ClampedArray(this.memory.buffer, offest, this.doomWidth * this.doomHeight * 4);
    if (this.onPixelRender) {
      for (let y = 0;y < this.screenHeight; y++) {
        for (let x = 0;x < this.screenWidth; x++) {
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
    if (this.onFrameRender) {
      this.onFrameRender({ screen });
    }
  };
  async start() {
    const game = await this.loadGame();
    this.keyboard.bindKeyDown((keyCode) => game.instance.exports.add_browser_event(0, keyCode));
    this.keyboard.bindKeyUp((keyCode) => game.instance.exports.add_browser_event(1, keyCode));
    game.instance.exports.main();
    const step = () => {
      game.instance.exports.doom_loop_step();
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }
}
export {
  DOOM
};
