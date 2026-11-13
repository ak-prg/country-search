import type { Country, State, ViewCallbacks } from './types';
import { createDetailsModal, initDetailsModal } from './UI/details-modal';
import { elementCreators } from './UI/element-creators';
import { createHeader, setHeaderInput } from './UI/header';
import { createHistory, updateHistoryList } from './UI/history';
import { createResults, updateResults } from './UI/results';

const { createElement } = elementCreators;

let detailsModal: HTMLDialogElement;

// initial rendering: everything static is built once
export function createViews(callbacks: ViewCallbacks): void {
  createHeader(callbacks.headerCb);

  const page = createElement('div', {
    className: 'page',
    parent: document.body,
  });
  createHistory(page, callbacks.historyCb);
  createResults(page, callbacks.resultsCb);

  detailsModal = createDetailsModal();
}

// rerender: history and list of countries
export function updateViews(state: State): void {
  updateHistoryList(state);
  updateResults(state);
}

export function openInitDetailsModal(country: Country): void {
  initDetailsModal(detailsModal, country);
}

export function setSearchInput(value: string): void {
  setHeaderInput(value);
}
