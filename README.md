# An Asynchronous Action Definition for Redux

If you're doing asynchronous actions with redux-thunk, this mini lib provides a standardized way of tracking them in your store and querying for progress and errors with reselect.

This lib is intended to be used with [redux-thunk](https://github.com/gaearon/redux-thunk) and [reselect](https://github.com/reactjs/reselect).

## Why would I use this?

* It reduces a lot of the boiler plate associated with HTTP calls in redux
* It enforces a standard way of tracking progress and errors in the store.
* It can deduplicate actions that perform the same operation simultaneously,
helping to eliminate race conditions in your code.

## API

### Dispatching

You can use `createAsyncAction` to make an action from an action type and a function that returns a promise:

```js
import { createAsyncAction } from '@wealthsimple/async-action';

const operation = () => http
  .get('/api/accounts')
  .then(r => r.data));

export const fetchAccountData = () =>
  createAsyncAction('FETCH_ACCOUNT_DATA', operation);
```

This function returns a thunk which can be dispatched to Redux.

Dispatching this thunk will cause a pending action to be fired; upon completion of the operation either a completion or failure action will be fired with the result of the function you passed in.

### Reducing:

You can listen to these things in your reducers:

```js
import { isComplete, isFailed } from '@wealthsimple/async-action';

const accountDataReducer = (state = {}, action) => {
  if (action.type === 'FETCH_ACCOUNT_DATA' && isComplete(action)) {
    return action.payload;
  }

  return state;
}
```

### Selecting:

This libary also provides helpers getting information about ongoing actions: `makeIsPendingSelector` and `makeErrorSelector`. These two functions let you make selectors for pending and error states from your actions:

```js
const selectAccountsFetchPending = makeIsPendingSelector(FETCH_ACCOUNT_DATA);

selectAccountsPending(state)
```

```js
const selectAccountsFetchFailed = makeErrorSelector(FETCH_ACCOUNT_DATA);

// If an error happened, this will give you an object containing the error's
// name, message, and stack trace.
selectAccountsFetchFailed(state)
```

