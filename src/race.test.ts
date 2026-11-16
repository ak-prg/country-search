import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEBOUNCE_TIME } from './constants';
import type { ApiCountry } from './types';

// The view needs a DOM and the storage needs localStorage: replace both.
vi.mock('./view', () => ({
  createViews: vi.fn(),
  updateViews: vi.fn(),
  openInitDetailsModal: vi.fn(),
  setSearchInput: vi.fn(),
}));

vi.mock('./storage', () => ({
  fetchData: () => [],
  persistData: vi.fn(),
}));

interface PendingRequest {
  url: string;
  signal: AbortSignal;
  resolve: (countries: ApiCountry[]) => void;
}

const country = (name: string, alpha3Code: string): ApiCountry => ({
  name,
  nativeName: name,
  alpha2Code: alpha3Code.slice(0, 2),
  alpha3Code,
  flag: '',
  flags: { png: `${alpha3Code}.png`, svg: `${alpha3Code}.svg` },
  region: 'Europe',
  population: 1,
  timezones: [],
  callingCodes: [],
  topLevelDomain: [],
});

const SPAIN = [country('Spain', 'ESP')];
const STALE = [country('Spain', 'ESP'), country('Western Sahara', 'ESH')];

describe('race of stale responses', () => {
  let requests: PendingRequest[];
  let app: typeof import('./controller');
  let model: typeof import('./model');

  // Every request stays pending until the test resolves it by hand.
  // Like the real fetch, it rejects with AbortError when its signal is aborted.
  const fetchMock = (
    url: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> =>
    new Promise((resolve, reject) => {
      const signal = init?.signal as AbortSignal;
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }
      signal.addEventListener('abort', () => reject(signal.reason));

      requests.push({
        url: String(url),
        signal,
        resolve: (countries) =>
          resolve({
            ok: true,
            status: 200,
            json: async () => countries,
          } as Response),
      });
    });

  const request = (index: number): PendingRequest => {
    const found = requests[index];
    if (!found) throw new Error(`request ${index} was not sent`);
    return found;
  };

  // lets the debounce timer fire and all pending promises settle
  const wait = (ms: number): Promise<unknown> =>
    vi.advanceTimersByTimeAsync(ms);

  beforeEach(async () => {
    vi.useFakeTimers();
    requests = [];
    vi.stubGlobal('fetch', vi.fn(fetchMock));

    // fresh cache, state and controllers for every test
    vi.resetModules();
    app = await import('./controller');
    model = await import('./model');
    app.main();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows only the last query when the earlier response arrives later', async () => {
    app.onChange('sp');
    await wait(DEBOUNCE_TIME);
    app.onChange('spain');
    await wait(DEBOUNCE_TIME);

    expect(requests).toHaveLength(2);

    // inverted order: the later request resolves first
    request(1).resolve(SPAIN);
    await wait(0);
    request(0).resolve(STALE);
    await wait(0);

    expect(model.state.currentQuery).toBe('spain');
    expect(model.state.status).toBe('results');
    expect(model.state.countries.map((c) => c.name)).toEqual(['Spain']);
  });

  it('really aborts the earlier request instead of ignoring its response', async () => {
    app.onChange('sp');
    await wait(DEBOUNCE_TIME);

    expect(request(0).signal.aborted).toBe(false);

    app.onChange('spain');
    await wait(0);

    // aborted on the input change itself: no debounce time has passed
    expect(request(0).signal.aborted).toBe(true);
    expect(request(0).signal.reason).toMatchObject({ name: 'AbortError' });
    expect(requests).toHaveLength(1);
  });

  it('does not show the abort of its own request as an error', async () => {
    app.onChange('sp');
    await wait(DEBOUNCE_TIME);
    app.onChange('spain');
    await wait(DEBOUNCE_TIME);

    expect(model.state.status).toBe('loading');
    expect(model.state.errorMessage).toBe('');

    request(1).resolve(SPAIN);
    await wait(0);

    expect(model.state.status).toBe('results');
    expect(model.state.errorMessage).toBe('');
  });

  it('keeps only the completed query in the history', async () => {
    app.onChange('sp');
    await wait(DEBOUNCE_TIME);
    app.onChange('spain');
    await wait(DEBOUNCE_TIME);

    request(1).resolve(SPAIN);
    await wait(0);
    request(0).resolve(STALE);
    await wait(0);

    expect(model.state.searchHistory).toEqual(['spain']);
  });

  it('shows only the last of several quick queries', async () => {
    const queries = ['s', 'sp', 'spa', 'spai', 'spain'];

    for (const query of queries) {
      app.onChange(query);
      await wait(DEBOUNCE_TIME);
    }

    expect(requests).toHaveLength(queries.length);
    requests
      .slice(0, -1)
      .forEach((stale) => expect(stale.signal.aborted).toBe(true));
    expect(request(4).signal.aborted).toBe(false);

    request(4).resolve(SPAIN);
    await wait(0);
    requests.slice(0, -1).forEach((stale) => stale.resolve(STALE));
    await wait(0);

    expect(model.state.currentQuery).toBe('spain');
    expect(model.state.countries.map((c) => c.name)).toEqual(['Spain']);
  });
});
