import type { State, StateCallbacks } from './types';
import { fetchData, persistData } from './storage';

export let state: State = {} as State;
let onChange: () => void;

export function initState(stateCb: StateCallbacks): void {
  onChange = stateCb.onChangeDetected;
  state = {
    searchHistory: fetchData(),
    currentQuery: '',
    errorMessage: '',
    countries: [],
    status: 'idle',
  };
}

export function setState(patch: Partial<State>): void {
  state = { ...state, ...patch };
  onChange();
}

export function updateHistory(query: string): void {
  setState({
    searchHistory: [
      ...state.searchHistory.filter((q) => q !== query).slice(-9),
      query,
    ],
  });
  persistData(state.searchHistory);
}
