import type { ResultsCallbacks, State } from '../types';
import { createCountryCard } from './country-card';
import { elementCreators } from './element-creators';

const { createElement, createButton, appendEach } = elementCreators;

let resultsCb: ResultsCallbacks;
let loading: HTMLDivElement;
let empty: HTMLDivElement;
let error: HTMLDivElement;
let errorText: HTMLSpanElement;
let grid: HTMLDivElement;

export function createResults(
  parent: HTMLElement,
  callbacks: ResultsCallbacks
): HTMLElement {
  resultsCb = callbacks;

  const results = createElement('main', { className: 'results', parent });

  loading = createElement('div', { className: 'status', parent: results });
  createElement('div', {
    className: 'status__spinner',
    attrs: { role: 'status', 'aria-label': 'Loading' },
    parent: loading,
  });
  createElement('span', { text: 'Loading...', parent: loading });

  empty = createElement('div', { className: 'status', parent: results });
  createElement('span', {
    text: 'Nothing found. Try another name.',
    parent: empty,
  });

  error = createElement('div', {
    className: 'status status--error',
    parent: results,
  });
  errorText = createElement('span', { parent: error });
  const retryButton = createButton('Retry', 'header__button', error);
  retryButton.addEventListener('click', () => resultsCb.onRetry());

  grid = createElement('div', { className: 'card-grid', parent: results });

  return results;
}

// exactly one of the four blocks is visible; none when status is "idle"
export function updateResults(state: State): void {
  loading.hidden = state.status !== 'loading';
  empty.hidden = state.status !== 'empty';
  error.hidden = state.status !== 'error';
  grid.hidden = state.status !== 'results';

  errorText.textContent = state.errorMessage;

  grid.replaceChildren();
  appendEach(grid, state.countries, (country) =>
    createCountryCard(country, resultsCb.onOpenDetails)
  );
}
