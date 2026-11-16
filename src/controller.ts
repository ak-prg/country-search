import { debounce } from './core/debounce';
import { fetchWrapper, toAbort } from './core/search-utils';
import { state, initState, setState, updateHistory } from './model';
import { DEBOUNCE_TIME } from './constants';
import type {
  HeaderCallbacks,
  HistoryCallbacks,
  ResultsCallbacks,
  StateCallbacks,
  ViewCallbacks,
} from './types';
import { mapCountryResponse } from './core/mapCountryResponse';
import {
  createViews,
  openInitDetailsModal,
  setSearchInput,
  updateViews,
} from './view';

let stateCb: StateCallbacks;
let viewCb: ViewCallbacks;
let headerCb: HeaderCallbacks;
let historyCb: HistoryCallbacks;
let resultsCb: ResultsCallbacks;

export function main(): void {
  stateCb = { onChangeDetected };
  headerCb = { onChange };
  historyCb = { onHistoryClick };
  resultsCb = { onRetry: () => onRetry(state.currentQuery), onOpenDetails };
  viewCb = { headerCb, historyCb, resultsCb };

  initState(stateCb);
  createViews(viewCb);
  updateViews(state);
}

function onChangeDetected(): void {
  updateViews(state);
}

export async function search(query: string): Promise<void> {
  setState({ currentQuery: query, errorMessage: '', status: 'loading' });
  const { countries, errorMessage } = await fetchWrapper(query);

  if (countries) {
    updateHistory(query);
    setState({
      countries: countries.map(mapCountryResponse),
      status: countries.length > 0 ? 'results' : 'empty',
    });
  } else if (errorMessage) {
    setState({ errorMessage, countries: [], status: 'error' });
  }
}

const debounceHandler = debounce(search, DEBOUNCE_TIME);

export const onChange = (input: string): void => {
  if (input !== state.currentQuery) toAbort();
  if (input === '') handleEmptyInput();
  else debounceHandler(input);
};

export const onRetry = (input: string): void => {
  debounceHandler.cancel();
  search(input);
};

export function handleEmptyInput(): void {
  debounceHandler.cancel();
  setState({ countries: [], status: 'idle' });
}

export function onHistoryClick(query: string): void {
  setSearchInput(query);
  onRetry(query);
}

export function onOpenDetails(code: string): void {
  const country = state.countries.find((c) => c.code === code);
  if (country) openInitDetailsModal(country);
}
