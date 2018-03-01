import type { Dispatch } from 'redux';
import _ from 'lodash';
import type { AsyncAction, AsyncOperation } from './async.types';
import { ASYNC_PENDING, ASYNC_COMPLETE, ASYNC_FAILED } from './async.constants';

/**
 * Helper for API requests or other async actions.
 *
 * Associates an action type with a function that returns a promise; dispatches
 * three versions of the action with status PENDING, SUCCESS, or ERROR as
 * appropriate.
 *
 * Returns a thunk that you can dispatch.
 */
export const createAsyncAction = <R>(
  type: string,
  operation: AsyncOperation<R>,
  identifier?: string,
) => (dispatch: Dispatch<AsyncAction>) => {
  dispatch({
    type,
    meta: {
      status: ASYNC_PENDING,
      identifier,
    },
  });

  operation()
    .then(result => dispatch({
      type,
      payload: result,
      meta: {
        status: ASYNC_COMPLETE,
        identifier,
      },
    }))
    .catch(error => dispatch({
      type,
      error: error || new Error('Unknown'),
      meta: {
        status: ASYNC_FAILED,
        identifier,
      },
    }));
};

export const isPending = (action: AsyncAction) =>
  _.get(action, 'meta.status') === ASYNC_PENDING;

export const isComplete = (action: AsyncAction) =>
  _.get(action, 'meta.status') === ASYNC_COMPLETE;

export const isFailed = (action: AsyncAction) =>
  _.get(action, 'meta.status') === ASYNC_FAILED;
