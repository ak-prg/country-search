import { HttpError } from '../HttpError';

export function classifyError(err: unknown): string {
  if (!(err instanceof Error)) return 'Something went wrong.';
  if (err.name === 'AbortError') return '';
  if (err.name === 'TimeoutError')
    return 'The server took too long to respond.';
  if (err.name === 'TypeError') return 'Network error. Check your connection.';
  if (err.name === 'SyntaxError')
    return 'Received invalid data from the server.';
  if (err instanceof HttpError) return `Server error (${err.status}).`;
  return 'Something went wrong.';
}
