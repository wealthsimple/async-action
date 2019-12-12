import { AnyAction, Action, Dispatch } from 'redux';
import {
  AsyncAction,
  AsyncActionOptions,
  AsyncThunk,
  GetState,
} from './async.types';
import {
  makeIsPendingSelector,
  makeCachedResponseSelector,
} from './async.selectors';

export const isPending = (action: AnyAction): boolean => {
  const asyncAction = action as AsyncAction<any, any>;
  return asyncAction.meta?.status === 'ASYNC_PENDING';
};

export const isComplete = (action: AnyAction): boolean => {
  const asyncAction = action as AsyncAction<any, any>;
  return (
    asyncAction.meta?.status === 'ASYNC_COMPLETE' ||
    asyncAction.meta?.status === 'ASYNC_CACHED'
  );
};

export const isFailed = (action: AnyAction): boolean => {
  const asyncAction = action as AsyncAction<any, any>;
  return asyncAction.meta?.status === 'ASYNC_FAILED';
};

export const isBeingReset = (action: AnyAction): boolean => {
  const asyncAction = action as AsyncAction<any, any>;
  return asyncAction.meta?.status === 'ASYNC_RESET';
};

const _dedupedPromises: { [key: string]: Promise<any> } = {};

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
export const createAsyncAction = <
  AAction extends AsyncAction<Action, any>,
  State extends object = object
>(
  action: Omit<AAction, keyof { meta: any; error: any; payload: any }>,
  operation: AsyncThunk<AAction['payload']>,
  { identifier, cache, ttlSeconds, overwriteCache }: AsyncActionOptions = {},
): AsyncThunk<NonNullable<AAction['payload']>, State> => {
  // We are returning a Thunk (a function that itself dispatches actions).
  const thunk = (
    dispatch: Dispatch,
    getState: GetState<State>,
  ): Promise<AAction['payload']> => {
    const isPendingSelector = makeIsPendingSelector(action.type, identifier);
    if (isPendingSelector(getState())) {
      dispatch({
        ...action,
        payload: null,
        error: null,
        meta: { status: 'ASYNC_DEDUPED', identifier },
      });
      return _dedupedPromises[`${action.type}(${identifier || ''})`];
    }

    if (cache && !overwriteCache) {
      const cachedResponseSelector = makeCachedResponseSelector(
        action.type,
        identifier,
        ttlSeconds,
      );

      const cachedResponse = cachedResponseSelector(getState());
      if (cachedResponse) {
        dispatch({
          ...action,
          payload: cachedResponse,
          error: null,
          meta: { status: 'ASYNC_CACHED', identifier },
        });

        return Promise.resolve(cachedResponse);
      }
    }

    dispatch({
      ...action,
      payload: null,
      error: null,
      meta: { status: 'ASYNC_PENDING', identifier },
    });

    const promise = operation(dispatch, getState)
      .then(result => {
        dispatch({
          ...action,
          payload: result,
          error: null,
          meta: { status: 'ASYNC_COMPLETE', identifier, cache },
        });

        delete _dedupedPromises[`${action.type}(${identifier || ''})`];
        return result;
      })
      .catch(error => {
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

        delete _dedupedPromises[`${action.type}(${identifier || ''})`];
        throw error;
      });

    _dedupedPromises[`${action.type}(${identifier || ''})`] = promise;
    return promise;
  };

  return thunk;
};

export const resetAsyncAction = (
  type: string,
  identifier?: string,
): AnyAction => ({
  type,
  meta: { status: 'ASYNC_RESET', identifier },
});
