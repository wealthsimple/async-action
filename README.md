# An Asynchronous Action Definition for Redux

If you're doing asynchronous actions with redux-thunk, this mini lib provides a standardized way of tracking them in your store and querying for progress and errors with reselect.

The idea is to provide a consistent way of 'flattening temporal dependencies' into queryable state so your UI can be more reactive and predictable.

TODO:
* setup instructions
* usage examples
  * making an HTTP request
  * handling response data in your reducer
  * checking if it's still pending
  * checking if it failed
* lint
* flow
* unit tests
