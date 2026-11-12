import { BASE_URL } from '../constants';
import { HttpError } from '../HttpError';
import type { ApiCountry } from '../types';

export async function searchCountries(
  query: string,
  signal: AbortSignal
): Promise<ApiCountry[]> {
  const res = await fetch(`${BASE_URL}${encodeURIComponent(query)}`, {
    signal,
  });
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) throw new HttpError(res.status);
  return await res.json();
}
