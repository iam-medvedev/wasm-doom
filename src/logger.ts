/**
 * Handles logging output from the DOOM
 *
 * Reads strings from WASM memory and forwards them to the browser console.
 */
export class Logger {
  constructor(private memory: WebAssembly.Memory) {}

  /** Reads a UTF-8 encoded string from WebAssembly memory */
  private readWasmString = (offset: number, length: number) => {
    const bytes = new Uint8Array(this.memory.buffer, offset, length);
    return new TextDecoder('utf8').decode(bytes);
  };

  /** Returns a logging function that can be called from WASM */
  public getMethod = (method: 'log' | 'info' | 'error') => {
    return (offset: number, length: number) => {
      const lines = this.readWasmString(offset, length).split('\n');

      for (let i = 0; i < lines.length; ++i) {
        if (lines[i]?.length === 0) {
          continue;
        }

        console[method](lines[i]);
      }
    };
  };
}
