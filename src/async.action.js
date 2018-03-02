import type { Dispatch } from 'redux';
import _ from 'lodash';
import type { AsyncAction, AsyncOperation } from './async.types';
import { ASYNC_PENDING, ASYNC_COMPLETE, ASYNC_FAILED } from './async.constants';


export const isPending = (action: AsyncAction) =>
  _.get(action, 'meta.status') === ASYNC_PENDING;

export const isComplete = (action: AsyncAction) =>
  _.get(action, 'meta.status') === ASYNC_COMPLETE;

export const isFailed = (action: AsyncAction) =>
  _.get(action, 'meta.status') === ASYNC_FAILED;

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
) => (dispatch: Dispatch<AsyncAction>): Promise<void> => {
  dispatch({
    type,
    meta: {
      status: ASYNC_PENDING,
      identifier,
    },
  });

  return operation()
    .then(result => dispatch({
      type,
      payload: result,
      meta: {
        status: ASYNC_COMPLETE,
        identifier,
      },
    }))
    .catch(error => {
      try {
        dispatch({
          type,
          error: error ? JSON.stringify(error) : 'Unknown',
          meta: {
            status: ASYNC_FAILED,
            identifier,
          },
        });
      } catch (e) {
        console.error('Error during dispatch', e);
        throw e;
      }
      throw error;
    });
};
