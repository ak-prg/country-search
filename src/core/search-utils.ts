import { searchCountries } from './searchCountries';
import type { ApiCountry, Entry, SearchResult } from '../types';
import { TIMEOUT } from '../constants';
import { classifyError } from './classifyError';

let currentCallerCtrl: AbortController;
const cache: Map<string, Entry> = new Map();

export function toAbort(): void {
  if (currentCallerCtrl) currentCallerCtrl.abort();
}

// used by sinle caller
export async function fetchWrapper(query: string): Promise<SearchResult> {
  const previousCtrl = currentCallerCtrl;
  const own = new AbortController();
  currentCallerCtrl = own;

  try {
    const result = cachedSearch(query, own.signal);
    if (previousCtrl) previousCtrl.abort();
    return { countries: await result, errorMessage: '' };
  } catch (err) {
    return { countries: null, errorMessage: classifyError(err) };
  }
}

// Cache and deduplication. can be used by several differtent callers
export async function cachedSearch(
  query: string,
  signal: AbortSignal
): Promise<ApiCountry[]> {
  let entry = cache.get(query);
  if (!entry) entry = startRequest(query);
  entry.subscribers++;

  try {
    return await Promise.race([entry.promise, rejectOnAbort(signal)]);
  } catch (err) {
    if (!signal.aborted) cache.delete(query);
    throw err;
  } finally {
    entry.subscribers--;
    if (signal.aborted && entry.subscribers === 0) {
      entry.controller.abort();
      cache.delete(query);
    }
  }
}

export function rejectOnAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason));
  });
}

export function startRequest(query: string): Entry {
  const fetchController = new AbortController();

  const signal = AbortSignal.any([
    fetchController.signal,
    AbortSignal.timeout(TIMEOUT),
  ]);

  const entry: Entry = {
    promise: searchCountries(query, signal),
    controller: fetchController,
    subscribers: 0,
  };

  cache.set(query, entry);

  return entry;
}
