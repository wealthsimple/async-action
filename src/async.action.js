// @flow
import type { Dispatch } from 'redux';
import type { AsyncAction, AsyncThunk, AsyncActionOptions, SimpleAction } from './async.types';
import { makeIsPendingSelector } from './async.selectors';

export const isPending = (action: $Subtype<SimpleAction>) =>
  !!action.meta && action.meta.status === 'ASYNC_PENDING';

export const isComplete = (action: $Subtype<SimpleAction>) =>
  !!action.meta && action.meta.status === 'ASYNC_COMPLETE';

export const isFailed = (action: $Subtype<SimpleAction>) =>
  !!action.meta && action.meta.status === 'ASYNC_FAILED';

/**
 * Helper for API requests or other async actions.
 *
 * Associates an action with a function that returns a promise; dispatches
 * three versions of the action with status PENDING, SUCCESS, or ERROR as
 * appropriate.
 *
 * Returns a thunk that you can dispatch.
 *
 * The optional 'options' parameter gives you more control:
 *   * identifier can be used to disambiguate two instances of the same action.
 */
export const createAsyncAction = <Action: SimpleAction, Payload>(
  action: Action,
  operation: AsyncThunk,
  { identifier }: AsyncActionOptions = {},
): AsyncThunk => (
  dispatch: Dispatch<AsyncAction<Action, Payload>>,
  getState: Function,
): Promise<void> => {
  const isPendingSelector = makeIsPendingSelector(action.type, identifier);
  if (isPendingSelector(getState())) {
    dispatch({
      ...action,
      payload: null,
      error: null,
      meta: { status: 'ASYNC_DEDUPED', identifier },
    });
    return Promise.resolve();
  }

  dispatch({
    ...action,
    payload: null,
    error: null,
    meta: { status: 'ASYNC_PENDING', identifier },
  });

  return operation(dispatch, getState)
    .then((result) => {
      dispatch({
        ...action,
        payload: result,
        error: null,
        meta: { status: 'ASYNC_COMPLETE', identifier },
      });
    })
    .catch((error) => {
      try {
        dispatch({
          ...action,
          payload: null,
          error,
          meta: { status: 'ASYNC_FAILED', identifier },
        });
      } catch (e) {
        throw e;
      }
      throw error;
    });
};
