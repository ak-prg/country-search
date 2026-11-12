import type { DebouncedFn, SearchFn } from '../types';

export function debounce(fn: SearchFn, delay: number): DebouncedFn {
  let timer: number | undefined;

  function debounceHandler(input: string): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(input);
    }, delay);
  }

  debounceHandler.cancel = (): void => {
    if (timer) clearTimeout(timer);
  };

  return debounceHandler;
}
