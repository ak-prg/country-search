import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce';

const DELAY = 400;

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a function', () => {
    expect(typeof debounce(vi.fn(), DELAY)).toBe('function');
  });

  it('does not call fn immediately', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, DELAY);

    debounced('a');

    expect(fn).not.toHaveBeenCalled();
  });

  it('does not call fn before the delay has passed', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, DELAY);

    debounced('a');
    vi.advanceTimersByTime(DELAY - 1);

    expect(fn).not.toHaveBeenCalled();
  });

  it('calls fn once with the argument after the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, DELAY);

    debounced('spain');
    vi.advanceTimersByTime(DELAY);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('spain');
  });

  it('resets the timer when called again within the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, DELAY);

    debounced('s');
    vi.advanceTimersByTime(DELAY - 100);
    debounced('sp');
    vi.advanceTimersByTime(DELAY - 100);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls fn only with the last argument of a burst', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, DELAY);

    ['s', 'sp', 'spa', 'spai', 'spain'].forEach((input) => {
      debounced(input);
      vi.advanceTimersByTime(50);
    });
    vi.advanceTimersByTime(DELAY);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('spain');
  });

  it('calls fn for each call when calls are further apart than the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, DELAY);

    debounced('first');
    vi.advanceTimersByTime(DELAY);
    debounced('second');
    vi.advanceTimersByTime(DELAY);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'first');
    expect(fn).toHaveBeenNthCalledWith(2, 'second');
  });

  it.each([0, 100, 1000])('respects a delay of %i ms', (delay) => {
    const fn = vi.fn();
    const debounced = debounce(fn, delay);

    debounced('a');
    vi.advanceTimersByTime(delay);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('keeps separate timers for separate debounced functions', () => {
    const first = vi.fn();
    const second = vi.fn();
    const debouncedFirst = debounce(first, DELAY);
    const debouncedSecond = debounce(second, DELAY);

    debouncedFirst('a');
    vi.advanceTimersByTime(DELAY - 100);
    debouncedSecond('b');
    vi.advanceTimersByTime(100);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  describe('cancel', () => {
    it('prevents the pending call', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, DELAY);

      debounced('a');
      debounced.cancel();
      vi.advanceTimersByTime(DELAY);

      expect(fn).not.toHaveBeenCalled();
    });

    it('does not throw when nothing is pending', () => {
      const debounced = debounce(vi.fn(), DELAY);

      expect(() => debounced.cancel()).not.toThrow();
    });

    it('allows new calls after cancel', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, DELAY);

      debounced('a');
      debounced.cancel();
      debounced('b');
      vi.advanceTimersByTime(DELAY);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('b');
    });
  });
});
