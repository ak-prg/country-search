import { describe, expect, it } from 'vitest';
import { HttpError } from '../HttpError';
import { classifyError } from './classifyError';

const TIMEOUT_MESSAGE = 'The server took too long to respond.';
const NETWORK_MESSAGE = 'Network error. Check your connection.';
const INVALID_DATA_MESSAGE = 'Received invalid data from the server.';
const UNKNOWN_MESSAGE = 'Something went wrong.';

const abortError = () => new DOMException('Aborted', 'AbortError');
const timeoutError = () => new DOMException('Timed out', 'TimeoutError');

describe('classifyError', () => {
  describe('AbortError: request cancelled by the user', () => {
    it('returns an empty string: nothing is shown to the user', () => {
      expect(classifyError(abortError())).toBe('');
    });

    it('recognises the reason of a real aborted signal', () => {
      const controller = new AbortController();
      controller.abort();

      expect(classifyError(controller.signal.reason)).toBe('');
    });
  });

  describe('TimeoutError: no response for a long time', () => {
    it('returns the timeout message', () => {
      expect(classifyError(timeoutError())).toBe(TIMEOUT_MESSAGE);
    });

    it('is a real error: the message is not empty', () => {
      expect(classifyError(timeoutError())).not.toBe('');
    });

    it('is distinguished from AbortError', () => {
      expect(classifyError(timeoutError())).not.toBe(
        classifyError(abortError())
      );
    });
  });

  describe('HttpError: unsuccessful status', () => {
    it.each([400, 403, 500, 503])('includes the status %i', (status) => {
      expect(classifyError(new HttpError(status))).toBe(
        `Server error (${status}).`
      );
    });

    it('is distinguished from AbortError and TimeoutError', () => {
      const message = classifyError(new HttpError(500));

      expect(message).not.toBe(classifyError(abortError()));
      expect(message).not.toBe(classifyError(timeoutError()));
    });
  });

  describe('network and data errors', () => {
    it('returns the network message for TypeError thrown by fetch', () => {
      expect(classifyError(new TypeError('Failed to fetch'))).toBe(
        NETWORK_MESSAGE
      );
    });

    it('returns the invalid data message for SyntaxError', () => {
      expect(classifyError(new SyntaxError('Unexpected token'))).toBe(
        INVALID_DATA_MESSAGE
      );
    });
  });

  describe('unknown errors', () => {
    it('returns the generic message for an unknown Error', () => {
      expect(classifyError(new Error('boom'))).toBe(UNKNOWN_MESSAGE);
      expect(classifyError(new RangeError('boom'))).toBe(UNKNOWN_MESSAGE);
    });

    it.each(['boom', 500, null, undefined, { name: 'AbortError' }])(
      'returns the generic message for a non-Error value: %s',
      (value) => {
        expect(classifyError(value)).toBe(UNKNOWN_MESSAGE);
      }
    );
  });

  describe('all kinds give different results', () => {
    it('returns a distinct message for each kind of error', () => {
      const messages = [
        classifyError(abortError()),
        classifyError(timeoutError()),
        classifyError(new HttpError(500)),
        classifyError(new TypeError('Failed to fetch')),
        classifyError(new SyntaxError('Unexpected token')),
        classifyError(new Error('boom')),
      ];

      expect(new Set(messages).size).toBe(messages.length);
    });
  });

  it('returns the same message on repeated calls', () => {
    expect(classifyError(timeoutError())).toBe(classifyError(timeoutError()));
  });
});
