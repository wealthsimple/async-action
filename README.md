# An Asynchronous Action Definition for Redux

If you're doing asynchronous actions with redux-thunk, this mini lib provides a standardized way of tracking them in your store and querying for progress and errors with reselect.

This lib is intended to be used with [redux-thunk](https://github.com/gaearon/redux-thunk) and [reselect](https://github.com/reactjs/reselect).

## Why would I use this?

* It reduces a lot of the boiler plate associated with HTTP calls in redux
* It enforces a standard way of tracking progress and errors in the store.
* It can deduplicate actions that perform the same operation simultaneously,
helping to eliminate race conditions in your code.
* It provides a consistent pattern for querying whether things are in progress or not.

## API - Basic Usage:

### Setup:

Import this project's reducer and add it to your store:

```js
import { combineReducers } from 'redux';
import { asyncActionReducer } from '@wealthsimple/async-action';

const rootReducer = combineReducers({
  asyncActions: asyncActionReducer,
  // ... your other reducers
});

// ...store setup as normal.
```

### Dispatching:

You can use `createAsyncAction` to make an action from a regular action and a function that returns a promise:

```js
import { createAsyncAction } from '@wealthsimple/async-action';

const action = {
  type: 'FETCH_ACCOUNTS',
};

const operation = () => http
  .get('/api/accounts')
  .then(r => r.data));

export const fetchAccounts = () =>
  createAsyncAction(action, operation);
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

This library also provides helpers getting information about ongoing actions: `makeIsPendingSelector` and `makeErrorSelector`. These two functions let you make selectors for pending and error states from your actions:

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

By default, there can only be one instance of an AsyncAction with a particular type active at any given time. This is fine for actions like `FETCH_ACCOUNTS` above that don't take any parameters. However what if you want to use the same action type to allow fetching of data for specific accounts?

```js
const fetchAccountData = (accountId: string) =>
  createAsyncAction(
    { type: 'FETCH_ACCOUNT_DATA' },
    () => http.get(`/api/accounts/${accountId}`));
```

This works fine until you want to fetch data for two accounts at the same time. The deduplication, pending states, and error tracking will get mixed up and you will have race conditions. To fix this, use the `identifier` option to disamibuate the requests:

```js
import { createAsyncAction } from '@wealthsimple/async-action';

const fetchAccountData = (accountId: string) =>
  createAsyncAction(
    { type: 'FETCH_ACCOUNT_DATA' },
    () => http.get(`/api/accounts/${accountId}`),
    { identifier: accountId });

// ...

dispatch(fetchAccountData('id1'));
dispatch(fetchAccountData('id2'));
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

### API - Advanced - Composing Async Actions:

### Chaining Multiple HTTP Calls in a Single Async Action:

If you only need to track pending status for the two HTTP calls together, you can define it as such by hiding the complexity inside the operation:

```js
const fetchTransactionsFromFirstAccount = createAsyncAction(
  { type: 'FETCH_TRANSACTIONS_FOR_FIRST_ACCOUNT' },
  async () => {
    const accounts = await http.get('/api/accounts').then(r => r.data);
    return await http.get(`/api/accounts/${accounts[0].id}/transactions`);
  }
);
```

The operation can be arbitrarily complex as long as it returns a promise.

### Chaining Multiple Async Actions into a Sequence:

Alternately, you may want to track pending/error status for each individual step.

Since the thunk returns a promise that resolves to the value of `operation`, async actions are easily composable:

```js
const fetchAccounts = () => createAsyncAction(
  { type: 'FETCH_ACCOUNTS' },
  () => http.get('/api/accounts').then(r => r.data));

const fetchTransactionsForAccount = (accountId) => createAsyncAction(
  { type: 'FETCH_TRANSACTIONS_FOR_ACCOUNT', accountId },
  () => http.get(`/api/accounts/${accountId}/transactions`).then(r => r.data),
  { identifier: accountId });

const fetchTransactionsFromFirstAccount = async () => {
  const accounts = await dispatch(fetchAccounts());
  return await dispatch(fetchTransactionsForAccount(accounts[0].id));
}
```

### API - Advanced - Caching:

AsyncAction exposes simple payload caching functionality.  The intent here is to allow your components to 'fire and forget' data fetch actions; we'll take care of not making redundant HTTP requests under the hood.
You can enable this by specifying 'cache: true' when you create the action:

```js
const getALargeDataSet = () => createAsyncAction(
 { type: 'GET_LARGE_DATA_SET' },
 () => http.get('/api/large_data_set'),
 { cache: true });

// The first invocation will execute `operation`, getting the data from HTTP.
await dispatch(getALargeDataSet());

// The second invocation will retrieve the payload from AsyncAction's internal cache.
// `operation` will not be executed a second time.
await dispatch(getALargeDataSet());
```

But what is caching without invalidation? AsyncAction also allows you to set a time-to-live value on your cache records:

```js
const getALargeDataSet = () => createAsyncAction(
 { type: 'GET_LARGE_DATA_SET' },
 () => http.get('/api/large_data_set'),
 { cache: true, ttlSeconds: 10 })
```

## Releasing New Versions

1) Update the version in package.json and yarn.lock
2) Merge these changes to master
4) Create a github release with `vX.Y.Z` where `X.Y.Z` is the number from package.json. Please follow semantic versioning.
