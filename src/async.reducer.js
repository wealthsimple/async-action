import type { AsyncAction } from './async.types';
import { ASYNC_PENDING, ASYNC_COMPLETE, ASYNC_FAILED } from './async.constants';

export type AsyncRequests = {
  [actionType: string]: {
    pending: boolean,
    error?: Error,
  },
}

/**
 * Keeps information about pending or failed async actions in the store.
 * UI can use this info to display spinners or error information.
 */
export const asyncActionReducer = (state: AsyncRequests = {}, action: AsyncAction) => {
  if (!action.meta) { return state; }
  const key = `${action.type}(${action.meta.identifier || ''})`;

  switch (action.meta.status) {
    case ASYNC_PENDING: return {
      ...state,
      [key]: { pending: true },
    };
    case ASYNC_COMPLETE: return {
      ...state,
      [key]: undefined,
    };
    case ASYNC_FAILED: return {
      ...state,
      [key]: {
        pending: false,
        error: action.error,
      },
    };
    default: return state;
  }
};
