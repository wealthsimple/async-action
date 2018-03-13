import type { Dispatch } from 'redux';
import type { AsyncAction, AsyncOperation, AsyncActionOptions } from './async.types';
import { makeIsPendingSelector } from './async.selectors';

export const isPending = (action: AsyncAction) =>
  !!action.meta && action.meta.status === 'ASYNC_PENDING';

export const isComplete = (action: AsyncAction) =>
  !!action.meta && action.meta.status === 'ASYNC_COMPLETE';

export const isFailed = (action: AsyncAction) =>
  !!action.meta && action.meta.status === 'ASYNC_FAILED';

/**
 * Helper for API requests or other async actions.
 *
 * Associates an action type with a function that returns a promise; dispatches
 * three versions of the action with status PENDING, SUCCESS, or ERROR as
 * appropriate.
 *
 * Returns a thunk that you can dispatch.
 *
 * The optional 'options' parameter gives you more control:
 *   * identifier can be used to disambiguate two instances of the same action.
 */
export const createAsyncAction = <R>(
  type: string,
  operation: AsyncOperation<R>,
  { identifier }: AsyncActionOptions = {},
) => (
  dispatch: Dispatch<*>,
  getState: Function,
): Promise<void> => {
  const isPendingSelector = makeIsPendingSelector(type, identifier);
  if (isPendingSelector(getState())) {
    dispatch({
      type,
      meta: { status: 'ASYNC_DEDUPED', identifier },
    });
    return Promise.resolve();
  }

  dispatch({
    type,
    meta: { status: 'ASYNC_PENDING', identifier },
  });

  return operation()
    .then((result) => {
      dispatch({
        type,
        payload: result,
        meta: { status: 'ASYNC_COMPLETE', identifier },
      });
    })
    .catch((error) => {
      try {
        dispatch({
          type,
          error,
          meta: { status: 'ASYNC_FAILED', identifier },
        });
      } catch (e) {
        throw e;
      }
      throw error;
    });
};
