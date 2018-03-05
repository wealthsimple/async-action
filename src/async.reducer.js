import _ from 'lodash';
import type { AsyncAction, AsyncActionState } from './async.types';

/**
 * Keeps information about pending or failed async actions in the store.
 * UI can use this info to display spinners or error information.
 */
export const asyncActionReducer = (
  state: AsyncActionState = {},
  action: AsyncAction,
): AsyncActionState => {
  if (!action.meta) { return state; }

  switch (action.meta.status) {
    case 'ASYNC_PENDING': return {
      ...state,
      [action.type]: {
        ...state[action.type],
        [action.meta.identifier || '']: {
          pending: true,
        },
      },
    };
    case 'ASYNC_COMPLETE': return {
      ...state,
      [action.type]: {
        ...state[action.type],
        [action.meta.identifier || '']: undefined,
      },
    };
    case 'ASYNC_FAILED': return {
      ...state,
      [action.type]: {
        ...state[action.type],
        [action.meta.identifier || '']: {
          pending: false,
          error: {
            name: _.get(action, 'error.name') || 'UNKNOWN',
            message: _.get(action, 'error.message') || 'UNKNOWN',
            stack: _.get(action, 'error.stack'),
          },
        },
      },
    };
    default: return state;
  }
};
