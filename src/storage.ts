import { LOC_STOR_KEY } from './constants';

export function fetchData(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LOC_STOR_KEY) ?? '[]') ?? [];
  } catch {
    return [];
  }
}

export function persistData(data: readonly string[]): void {
  localStorage.setItem(LOC_STOR_KEY, JSON.stringify(data));
}
