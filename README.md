# An Asynchronous Action Definition for Redux

If you're doing asynchronous actions with redux-thunk, this mini lib provides a standardized way of tracking them in your store and querying for progress and errors with reselect.

This lib is intended to be used with [redux-thunk](https://github.com/gaearon/redux-thunk) and [reselect](https://github.com/reactjs/reselect).

## Why would I use this?

- It reduces a lot of the boiler plate associated with HTTP calls in redux
- It enforces a standard way of tracking progress and errors in the store.
- It can deduplicate actions that perform the same operation simultaneously,
  helping to eliminate race conditions in your code.
- It provides a consistent pattern for querying whether things are in progress or not.

## How to use it?

We use [flow](http://flowtype.org) for static typings internally. By default, we've exposed the ES2017/Flow source code, assuming you want to customize your own babel setup. However if you're not into Flow, we also expose an ES5 UMD build in `dist.js`:

**Flow:**

```js
// @flow
import { createAsyncAction } from '@wealthsimple/async-action';
```

**Non-Flow ES6:**

```js
import { createAsyncAction } from '@wealthsimple/async-action/dist';
```

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
  type: 'ACCOUNTS_REQUESTED',
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
  if (action.type === 'ACCOUNTS_REQUESTED' && isComplete(action)) {
    return action.payload;
  }

  return state;
};
```

### Selecting:

This library also provides helpers getting information about ongoing actions: `makeIsPendingSelector` and `makeErrorSelector`. These two functions let you make selectors for pending and error states from your actions:

```js
const selectAccountsFetchPending = makeIsPendingSelector(ACCOUNTS_REQUESTED);

selectAccountsPending(state);
```

```js
const selectAccountsFetchFailed = makeErrorSelector(ACCOUNTS_REQUESTED);

// If an error happened, this will give you an object containing the error's
// name, message, and stack trace.
selectAccountsFetchFailed(state);
```

## API - Advanced - Disambiguating Actions

### Dispatching:

By default, there can only be one instance of an AsyncAction with a particular type active at any given time. This is fine for actions like `ACCOUNTS_REQUESTED` above that don't take any parameters. However what if you want to use the same action type to allow fetching of data for specific accounts?

```js
const fetchAccountData = (accountId: string) =>
  createAsyncAction({ type: 'ACCOUNT_DATA_REQUESTED' }, () =>
    http.get(`/api/accounts/${accountId}`),
  );
```

This works fine until you want to fetch data for two accounts at the same time. The deduplication, pending states, and error tracking will get mixed up and you will have race conditions. To fix this, use the `identifier` option to disamibuate the requests:

```js
import { createAsyncAction } from '@wealthsimple/async-action';

const fetchAccountData = (accountId: string) =>
  createAsyncAction(
    { type: 'ACCOUNT_DATA_REQUESTED' },
    () => http.get(`/api/accounts/${accountId}`),
    { identifier: accountId },
  );

// ...

dispatch(fetchAccountData('id1'));
dispatch(fetchAccountData('id2'));
```

This same identifier can also be used in your reducers to record return values independently for the two accounts:

```js
import { isComplete } from '@wealthsimple/async-action';

const accountDataReducer = (state = {}, action) => {
  if (action.type === 'ACCOUNT_DATA_REQUESTED' && isComplete(action)) {
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

const selector = makeIsPendingSelector('ACCOUNT_DATA_REQUESTED', 'id1');

// Returns true if the ACCOUNT_DATA_REQUESTED request with identifier === 'id1'
// is pending.
selector(state);
```

> Note that `pending` is only true _while the request is active_. In the case of a fetch request, there will likely be a render that happens prior to the request starting in some cases where `pending` is false, but there's also no data yet. This is because async action is also used for post requests and other general operations.

> If you want your selector to be `pending` prior to the start of the request, use the `initialvalue` parameter. A common use case for this is a LoadingIndicator for the first data fetch.

Or if you only care whether any instance of this request is pending you can use `makeAllPendingSelector`:

```js
import { makeAllPendingSelector } from '@wealthsimple/async-action';

const selector = makeAllPendingSelector('ACCOUNT_DATA_REQUESTED');

// Returns an array of identifiers for this action type that are
// currently pending.
selector(state);
```

### API - Advanced - Composing Async Actions:

#### Chaining Multiple HTTP Calls in a Single Async Action:

If you only need to track pending status for the two HTTP calls together, you can define it as such by hiding the complexity inside the operation:

```js
const fetchTransactionsFromFirstAccount = createAsyncAction(
  { type: 'FETCH_TRANSACTIONS_FOR_FIRST_ACCOUNT' },
  () => http.get('/api/accounts')
    .then(r => r.data)
    .then(accounts => http.get(`/api/accounts/${accounts[0].id}/transactions`),
);
```

The operation can be arbitrarily complex as long as it returns a promise.

#### Chaining Multiple Async Actions into a Sequence:

Alternately, you may want to track pending/error status for each individual step.

Since the thunk returns a promise that resolves to the value of `operation`, async actions are easily composable:

```js
const fetchAccounts = () => createAsyncAction(
  { type: 'ACCOUNTS_REQUESTED' },
  () => http.get('/api/accounts').then(r => r.data));

const fetchTransactionsForAccount = (accountId) => createAsyncAction(
  { type: 'ACCOUNT_TRANSACTIONS_REQUESTED' },
  () => http.get(`/api/accounts/${accountId}/transactions`).then(r => r.data),
  { identifier: accountId });

const fetchTransactionsFromFirstAccount = createAsyncAction(
  { type: FIRST_ACCOUNT_TRANSACTIONS_REQUESTED },
  dispatch =>
    dispatch(fetchAccounts())
      .then(accounts => dispatch(fetchTransactionsForAccount(accounts[0].id)));
```

### API - Advanced - Caching:

AsyncAction exposes simple payload caching functionality. The intent here is to allow your components to 'fire and forget' data fetch actions; we'll take care of not making redundant HTTP requests under the hood.

You can enable this by specifying 'cache: true' when you create the action:

```js
const getALargeDataSet = () =>
  createAsyncAction(
    { type: 'LARGE_DATA_SET_REQUESTED' },
    () => http.get('/api/large_data_set'),
    { cache: true },
  );

// The first invocation will execute `operation`, getting the data from HTTP.
await dispatch(getALargeDataSet());

// The second invocation will retrieve the payload from AsyncAction's internal cache.
// `operation` will not be executed a second time.
await dispatch(getALargeDataSet());
```

But what is caching without invalidation? AsyncAction also allows you to set a time-to-live value on your cache records:

```js
const getALargeDataSet = () =>
  createAsyncAction(
    { type: 'LARGE_DATA_SET_REQUESTED' },
    () => http.get('/api/large_data_set'),
    { cache: true, ttlSeconds: 10 },
  );
```

Alternately, you can tell an action not to use any preexisting cache value using the
`overwriteCache` option:

```js
const getALargeDataSet = () =>
  createAsyncAction(
    { type: 'LARGE_DATA_SET_REQUESTED' },
    () => http.get('/api/large_data_set'),
    { cache: true, ttlSeconds: 10, overwriteCache: true },
  );
```

This will ignore what's currently in the cache, but save the new response for
next time.

Finally, you can explicitly drop any cached values or error information:

```js
import { resetAsyncAction } from '@wealthsimple/async-action';

// ...

dispatch(resetAsyncAction('LARGE_DATA_SET_REQUESTED'));

// or if an identifier was used:

dispatch(resetAsyncAction('LARGE_DATA_SET_REQUESTED', 'id1'));
```

## A Word About Static Typing

AsyncAction is designed to be used with FlowType for static type checking. One common pattern for doing this is to define your action types as string literal types:

```js
type MySimpleAction = { type: 'SOMETHING_SIMPLE_HAPPENED' };
```

Your relevant action creator declares this as a return type to prevent you from making typos with the action type field:

```js
// Works:
const createMySimpleAction = (): MySimpleAction => ({
  type: 'SOMETHING_SIMPLE_HAPPENED',
});
```

```js
// Does not work: Flow catches the typo:
const createMySimpleAction = (): MySimpleAction => ({
  type: 'SOMETHING_SIIIIMPLE_HAPPENED',
});
```

This also extends to Reducers:

```js
type MySimpleAction = { type: 'SOMETHING_SIMPLE_HAPPENED' };
type MySimpleAction2 = { type: 'SOMETHING_SIMPLE_HAPPENED_2' };

type MyAction = MySimpleAction | MySimpleAction2;

const myReducer = (state: MyState, action: MyAction) => {
  switch (action.type) {
    // Works, with type refinement.
    case 'SOMETHING_SIMPLE_HAPPENED':
      // handleMySimpleAction: (state: MyState, action: MySimpleAction);
      return handleMySimpleAction(state, action);

    // Works, with type refinement.
    case 'SOMETHING_SIMPLE_HAPPENED_2':
      // handleMySimpleAction: (state: MyState, action: MySimpleAction2);
      return handleMySimpleAction2(state, action);

    // Flow catches this: 'TOTALLY_BOGUS_STRING' isn't one of the members of
    // MyAction.
    case 'TOTALLY_BOGUS_STRING':
      return handleMySimpleAction(state, action);
  }

  return state;
};
```

No need for a constants file: static type checking has got your back!

The good news is, you can also do this with AsyncAction:

```js
import { type AAction, createAsyncAction } from '@wealthsimple/async-action';

type SimplePayload = {| message: string |};
type MyAsyncAction = AAction<'SOMETHING_HAPPENED', SimplePayload>;
```

Because `createAsyncAction` actually returns a Thunk, it's not quite as simple as declaring a return type on the action creator. However we can get type checking using a generic argument:

```ts
// Works:
const myAsyncAction = () =>
  createAsyncAction<MyAsyncAction>('SOMETHING_HAPPENED', () =>
    Promise.resolve({ message: 'OHAI' }),
  );
```

```ts
// Does not work: action type is wrong.
const myAsyncAction = () =>
  createAsyncAction<MyAsyncAction>('SOOOMETHING_HAPPENED', () =>
    Promise.resolve({ message: 'OHAI' }),
  );
```

```ts
// Does not work: operation response does match the action's payload type.
const myAsyncAction = () =>
  createAsyncAction<MyAsyncAction>('SOMETHING_HAPPENED', () =>
    Promise.resolve({ count: 42 }),
  );
```

The reducer also acts the same as before:

```js
type SimplePayload = {| message: string |};
type SimplePayload2 = {| name: string |};

type MyAsyncAction = AAction<'SOMETHING_HAPPENED', SimplePayload>;
type MyAsyncAction2 = AACtion<'SOMETHING_HAPPENED_2', SimplePayload2>;

type MyAction = MyAsyncAction | MyAsyncAction;

const myReducer = (state: MyState, action: MyAction) => {
  switch (action.type) {
    // Works, with type refinement.
    case 'SOMETHING_HAPPENED':
      // handleMySimpleAction: (state: MyState, action: MyAsyncAction);
      return handleMyAsyncAction(state, action);

    // Works, with type refinement.
    case 'SOMETHING_HAPPENED_2':
      // handleMySimpleAction: (state: MyState, action: MyAsyncAction2);
      return handleMyAsyncAction2(state, action);

    // Flow catches this: 'TOTALLY_BOGUS_STRING' isn't one of the members of
    // MyAction.
    case 'TOTALLY_BOGUS_STRING':
      return handleMyAsyncAction(state, action);
  }

  return state;
};
```

## Releasing New Versions

This repo uses [semantic-release](https://github.com/semantic-release/semantic-release). Follow the commit messages conventions and releases will be made for you on merge to master.
