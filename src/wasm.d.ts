declare namespace WebAssembly {
  interface DoomExports {
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
  }

  function instantiateStreaming(
    source: Response | PromiseLike<Response>,
    importObject?: Bun.WebAssembly.Imports,
  ): Promise<{
    instance: {
      exports: DoomExports;
    };
  }>;
}
