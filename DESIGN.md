# Country Search: design notes

Paths are relative to `src`.

## 1. Cancellation of stale requests

**How it works.** There are two `AbortController`s, both in
`core/search-utils.ts`:

- **The caller's controller.** Each call of `fetchWrapper` creates its own.
  Aborting it only ends that caller's wait.
- **The request's controller.** `startRequest` creates it and stores it in the
  cache entry with the promise and a `subscribers` counter. Its signal is
  combined with the timeout and passed to `fetch`:
  `AbortSignal.any([fetchController.signal, AbortSignal.timeout(TIMEOUT)])`.

`cachedSearch(query, signal)` connects them. It increments `subscribers` and
waits with `Promise.race([entry.promise, rejectOnAbort(signal)])`. When the
caller is aborted, only its wait rejects with `AbortError`. In `finally` the
counter is decremented, and if no subscriber is left, `entry.controller.abort()`
cancels the network request.

**When.** `onChange` in `controller.ts` calls `toAbort()` on every change of
input, immediately and before the debounce delay, so a stale response cannot
arrive during the wait. If the new text equals the query already loading,
nothing is aborted and the running request is reused.

**Abort is not an error.** `classifyError` (`core/classifyError.ts`) returns an
empty message for `AbortError`, so nothing is shown. `TimeoutError`,
`HttpError` and network errors return a message, shown with the Retry button.
A 404 is not an error: `searchCountries` returns an empty array.

**Why not a flag "is this response current".**

- A flag only hides the response. The request keeps using a connection and the
  server, and on a slow network stale requests delay the needed one.
- Every place that uses a response must remember the check; one forgotten
  check brings the race back. After `abort()` the stale promise rejects, so its
  result cannot reach the state at all.
- A real abort is verifiable: the request is marked as cancelled in the
  Network tab, and `race.test.ts` checks that its signal is aborted.

**Why two controllers.** With one shared controller, a cancel by one caller
would reject the in-flight promise for every caller that reuses it from the
cache. With a controller per caller and a counter, the request is aborted only
when nobody needs it.

## 2. Debounce delay

The delay is 400 ms (`DEBOUNCE_TIME` in `constants.ts`, used by `debounce` in
`core/debounce.ts`). It is longer than the usual pause between keystrokes
inside a word, so one word gives one request, and short enough that the result
seems to appear as soon as the user stops typing.

- **Without the delay:** every keystroke sends a request. Typing `spain` sends
  five, four of which are aborted at once. The result stays correct, because
  cancellation does not depend on the debounce, but the API gets several times
  more requests and the loading indicator flickers.
- **With a much larger delay (2 s):** the user stops typing and nothing
  happens for two seconds. The waiting time is the delay plus the network time,
  and the interface feels broken.

Retry and a click on a history item skip the delay, because the user made an
explicit choice.

## 3. Complexity

**`mapCountryResponse`** (`core/mapCountryResponse.ts`). For a country with `b`
borders and `l` languages: scalar fields are O(1), border names are O(b) (one
`Map` lookup each), language names are O(l). Total **O(b + l)** time and
memory. Both are small and bounded, so it is effectively O(1) per country and
**O(n)** for a response of `n` countries.

Border names come from `COUNTRY_NAMES` (`codes.ts`), a `Map` built once in
O(m) for about 250 countries. A lookup is O(1) on average; searching the array
would be O(m) per border.

**Cache and deduplication** (`core/search-utils.ts`). The cache is a
`Map<string, Entry>` keyed by the query.

- Repeated query, or the same query still in flight: `cache.get`, **O(1)** on
  average.
- Storing and removing an entry: **O(1)** on average.
- Joining and leaving a request (`subscribers`): **O(1)**.
- Memory: **O(q)** for `q` distinct successful queries. Failed and aborted
  entries are removed.

Deduplication costs nothing extra: the entry is stored when the request
starts, so one lookup serves both a finished result and a pending one.

## 4. Clean code principles

| Principle                | Where                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Single responsibility    | `debounce` only delays. `searchCountries` only requests and checks the status. `classifyError` only maps an error to a message. `mapCountryResponse` only converts data. |
| One level of abstraction | `core/search-utils.ts`: `fetchWrapper` → `cachedSearch` → `startRequest` → `searchCountries`.                                                                            |
| Separation of concerns   | MVC: `model.ts` holds the state, `view.ts` and `UI/*` build the DOM, `controller.ts` connects them. Core functions know neither the DOM nor the state.                   |
| Pure functions           | `mapCountryResponse`, `classifyError`: a value in, a value out, no side effects.                                                                                         |
| Immutability             | `State` in `types.ts` is `Readonly`; `setState` and `updateHistory` in `model.ts` create new objects.                                                                    |
| Encapsulation            | The timer is inside the closure of `debounce`. `cache` and `currentCallerCtrl` are private to `core/search-utils.ts`.                                                    |
| No magic values          | `DEBOUNCE_TIME`, `TIMEOUT`, `BASE_URL`, `LOC_STOR_KEY` in `constants.ts`.                                                                                                |
| DRY                      | `UI/element-creators.ts` is the only place that creates DOM elements.                                                                                                    |
