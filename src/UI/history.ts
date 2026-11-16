import type { HistoryCallbacks, State } from '../types';
import { elementCreators } from './element-creators';

const { createElement, createButton, appendEach } = elementCreators;

let list: HTMLUListElement;
let historyCb: HistoryCallbacks;

export function createHistory(
  parent: HTMLElement,
  callbacks: HistoryCallbacks
): HTMLElement {
  historyCb = callbacks;

  const history = createElement('aside', { className: 'history', parent });
  createElement('h2', {
    className: 'history__title',
    text: 'History',
    parent: history,
  });
  list = createElement('ul', { className: 'history__list', parent: history });

  return history;
}

// newest query first
export function updateHistoryList(state: State): void {
  list.replaceChildren();
  appendEach(list, [...state.searchHistory].reverse(), createHistoryItem);
}

function createHistoryItem(query: string): HTMLLIElement {
  const item = createElement('li');
  const button = createButton(query, 'history__item', item);
  button.addEventListener('click', () => historyCb.onHistoryClick(query));

  return item;
}
