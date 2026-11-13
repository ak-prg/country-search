import { debounce } from './core/debounce';
import { fetchWrapper, toAbort } from './core/search-utils';
import { state, initState, setState, updateHistory } from './model';
import { DEBOUNCE_TIME } from './constants';
import type { StateCallbacks } from './types';
import { mapCountryResponse } from './core/mapCountryResponse';

let stateCb: StateCallbacks;

export function main(): void {
  stateCb = { onChangeDetected };
  initState(stateCb);
}

// called by the model on every state change
function onChangeDetected(): void {
  // TO DO
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
  // neither: the call was cancelled, do nothing
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
  // setSearchInput in UI
  onRetry(query);
}

export function onOpenDetails(code: string): void {
  const country = state.countries.find((c) => c.code === code);
  void country;
  // open modal;
}
