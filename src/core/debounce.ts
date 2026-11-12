import type { DebouncedFn, SearchFn } from '../types';

export function debounce(fn: SearchFn, delay: number): DebouncedFn {
  void fn;
  void delay;

  function debounceHandler(input: string): void {
    void input;
  }

  debounceHandler.cancel = (): void => {};

  return debounceHandler;
}
