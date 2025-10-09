type KeyboardFn = (keyCode: number) => void;

/**
 * Manages keyboard input for the DOOM
 */
export class Keyboard {
  constructor(private target: HTMLElement = document.documentElement) {}

  /** Binds a callback to keydown events */
  public bindKeyDown = (callback: KeyboardFn) => {
    this.target.addEventListener(
      'keydown',
      (e) => {
        callback(this.mapDoomKeyCode(e.keyCode));
        e.preventDefault();
      },
      false,
    );
  };

  /** Binds a callback to keyup events */
  public bindKeyUp = (callback: KeyboardFn) => {
    this.target.addEventListener(
      'keyup',
      (e) => {
        callback(this.mapDoomKeyCode(e.keyCode));
        e.preventDefault();
      },
      false,
    );
  };

  /** Converts browser keyCode to DOOM key code */
  private mapDoomKeyCode = (keyCode: number) => {
    // Doom seems to use mostly the same keycodes, except for the following
    switch (keyCode) {
      case 8:
        return 127; // KEY_BACKSPACE
      case 17:
        return 0x80 + 0x1d; // KEY_RCTRL
      case 18:
        return 0x80 + 0x38; // KEY_RALT
      case 37:
        return 0xac; // KEY_LEFTARROW
      case 38:
        return 0xad; // KEY_UPARROW
      case 39:
        return 0xae; // KEY_RIGHTARROW
      case 40:
        return 0xaf; // KEY_DOWNARROW
      default:
        if (keyCode >= 65 /* A */ && keyCode <= 90 /* Z */) {
          return keyCode + 32; // ASCII to lower case
        }
        if (keyCode >= 112 /* F1 */ && keyCode <= 123 /* F12 */) {
          return keyCode + 75; // KEY_F1
        }
        return keyCode;
    }
  };
}
