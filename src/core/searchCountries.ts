import type { ApiCountry } from '../types';

export async function searchCountries(
  query: string,
  signal: AbortSignal
): Promise<ApiCountry[]> {
  void query;
  void signal;

  return [];
}
