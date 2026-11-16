import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BASE_URL } from '../constants';
import { HttpError } from '../HttpError';
import type { ApiCountry } from '../types';
import { searchCountries } from './searchCountries';

const countries = [
  { name: 'Austria', alpha3Code: 'AUT' },
  { name: 'Australia', alpha3Code: 'AUS' },
] as ApiCountry[];

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status });

// Rejects like the real fetch when its signal is aborted
const abortableFetch = (
  _url: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> =>
  new Promise((_, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
  });

describe('searchCountries', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let signal: AbortSignal;

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    signal = new AbortController().signal;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('request', () => {
    it('calls fetch once with the query appended to the base url', async () => {
      fetchMock.mockResolvedValue(jsonResponse(countries));

      await searchCountries('aus', signal);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(`${BASE_URL}aus`);
    });

    it.each([
      ['costa rica', 'costa%20rica'],
      ['côte', 'c%C3%B4te'],
      ['a/b', 'a%2Fb'],
      ['a?b=c', 'a%3Fb%3Dc'],
    ])('encodes the query "%s" as "%s"', async (query, encoded) => {
      fetchMock.mockResolvedValue(jsonResponse(countries));

      await searchCountries(query, signal);

      expect(fetchMock.mock.calls[0]?.[0]).toBe(`${BASE_URL}${encoded}`);
    });

    it('passes the signal to fetch', async () => {
      fetchMock.mockResolvedValue(jsonResponse(countries));

      await searchCountries('aus', signal);

      expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(signal);
    });
  });

  describe('successful response', () => {
    it('resolves with the array of countries', async () => {
      fetchMock.mockResolvedValue(jsonResponse(countries));

      await expect(searchCountries('aus', signal)).resolves.toEqual(countries);
    });
  });

  describe('404: no matches', () => {
    it('resolves with an empty array', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Not Found' }, 404));

      await expect(searchCountries('zzz', signal)).resolves.toEqual([]);
    });

    it('resolves with an empty array even when the body is empty', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

      await expect(searchCountries('zzz', signal)).resolves.toEqual([]);
    });
  });

  describe('other unsuccessful statuses', () => {
    it.each([400, 401, 403, 429, 500, 502, 503])(
      'rejects with HttpError for status %i',
      async (status) => {
        fetchMock.mockResolvedValue(jsonResponse({}, status));

        await expect(searchCountries('aus', signal)).rejects.toBeInstanceOf(
          HttpError
        );
      }
    );

    it.each([400, 500, 503])(
      'stores the status %i in the error',
      async (status) => {
        fetchMock.mockResolvedValue(jsonResponse({}, status));

        await expect(searchCountries('aus', signal)).rejects.toMatchObject({
          status,
        });
      }
    );

    it('rejects with an instance of Error', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, 500));

      await expect(searchCountries('aus', signal)).rejects.toBeInstanceOf(
        Error
      );
    });
  });

  describe('failures of fetch itself', () => {
    it('rejects with the network error thrown by fetch', async () => {
      const networkError = new TypeError('Failed to fetch');
      fetchMock.mockRejectedValue(networkError);

      await expect(searchCountries('aus', signal)).rejects.toBe(networkError);
    });

    it('rejects with SyntaxError when the body is not valid JSON', async () => {
      fetchMock.mockResolvedValue(new Response('not json', { status: 200 }));

      await expect(searchCountries('aus', signal)).rejects.toBeInstanceOf(
        SyntaxError
      );
    });
  });

  describe('abort', () => {
    it('rejects with AbortError when the signal is aborted', async () => {
      const controller = new AbortController();
      fetchMock.mockImplementation(abortableFetch);

      const promise = searchCountries('aus', controller.signal);
      controller.abort();

      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('does not turn an abort into HttpError', async () => {
      const controller = new AbortController();
      fetchMock.mockImplementation(abortableFetch);

      const promise = searchCountries('aus', controller.signal);
      controller.abort();

      await expect(promise).rejects.not.toBeInstanceOf(HttpError);
    });
  });
});
