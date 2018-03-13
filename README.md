# An Asynchronous Action Definition for Redux

If you're doing asynchronous actions with redux-thunk, this mini lib provides a standardized way of tracking them in your store and querying for progress and errors with reselect.

This lib is intended to be used with [redux-thunk](https://github.com/gaearon/redux-thunk) and [reselect](https://github.com/reactjs/reselect).

## Why would I use this?

* It reduces a lot of the boiler plate associated with HTTP calls in redux
* It enforces a standard way of tracking progress and errors in the store.
* It can deduplicate actions that perform the same operation simultaneously,
helping to eliminate race conditions in your code.

## API - Basic Usage:

### Dispatching:

You can use `createAsyncAction` to make an action from an action type and a function that returns a promise:

```js
import { createAsyncAction } from '@wealthsimple/async-action';

const operation = () => http
  .get('/api/accounts')
  .then(r => r.data));

export const fetchAccounts = () =>
  createAsyncAction('FETCH_ACCOUNTS', operation);
```

This function returns a thunk which can be dispatched to Redux.

Dispatching this thunk will cause a pending action to be fired; upon completion of the operation either a completion or failure action will be fired with the result of the function you passed in.

### Reducing:

You can listen to these things in your reducers:

```js
import { isComplete } from '@wealthsimple/async-action';

const accountDataReducer = (state = {}, action) => {
  if (action.type === 'FETCH_ACCOUNTS' && isComplete(action)) {
    return action.payload;
  }

  return state;
}
```

### Selecting:

This libary also provides helpers getting information about ongoing actions: `makeIsPendingSelector` and `makeErrorSelector`. These two functions let you make selectors for pending and error states from your actions:

```js
const selectAccountsFetchPending = makeIsPendingSelector(FETCH_ACCOUNTS);

selectAccountsPending(state)
```

```js
const selectAccountsFetchFailed = makeErrorSelector(FETCH_ACCOUNTS);

// If an error happened, this will give you an object containing the error's
// name, message, and stack trace.
selectAccountsFetchFailed(state)
```

## API - Advanced - Disambiguating Actions

### Dispatching:

By default, there can only be one instance of an AsyncAction active at any given time. This is fine for actions like `FETCH_ACCOUNTS` above that don't take any parameters. However what if you want to use the same action type to allow fetching of data for specific accounts?

```js
const fetchAccountData = (accountId: string) =>
  createAsyncAction(
    'FETCH_ACCOUNT_DATA',
    () => http.get(`/api/accounts/${accountId}`));
```

This works fine until you want to fetch data for two accounts at the same time. The deduplication, pending states, and error tracking will get mixed up and you will have race conditions. To fix this, use the `identifier` option to disamibuate the requests:

```js
import { createAsyncAction } from '@wealthsimple/async-action';

const fetchAccountData = (accountId: string) =>
  createAsyncAction(
    'FETCH_ACCOUNT_DATA',
    () => http.get(`/api/accounts/${accountId}`),
    { identifier: accountId });

// ...

fetchAccountData('id1');
fetchAccountData('id2');
```

This same identifier can also be used in your reducers to record return values independently for the two accounts:

```js
import { isComplete } from '@wealthsimple/async-action';

const accountDataReducer = (state = {}, action) => {
  if (action.type === 'FETCH_ACCOUNT_DATA' && isComplete(action)) {
    return {
      ...state,
      [action.meta.identifier]: action.payload,
    },
  }

  return state;
}
```

### Selecting:

Finally, the identifier can also be used in your selectors to get info about specific requests:

```js
import { makeIsPendingSelector } from '@wealthsimple/async-action';

const selector = makeIsPendingSelector('FETCH_ACCOUNT_DATA', 'id1');

// Returns true if the FETCH_ACCOUNT_DATA request with identifier === 'id1'
// is pending.
selector(state);
```

Or if you only care whether any instance of this request is pending you can use `makeAllPendingSelector`:

```js
import { makeAllPendingSelector } from '@wealthsimple/async-action';

const selector = makeAllPendingSelector('FETCH_ACCOUNT_DATA', 'id1');

// Returns an array of identifiers for this action type that are
// currently pending.
selector(state);
```

## Releasing New Versions

1) Run `yarn prepare` to update the type defs that consumers will use in their code.
2) Update the version in package.lock
3) Merge these changes to master
4) Create a github release with `vX.Y.Z` where `X.Y.Z` is the number from package.json.