// @flow
import type { AsyncAction, AsyncActionState } from './async.types';

/**
 * Keeps information about pending or failed async actions in the store.
 * UI can use this info to display spinners or error information.
 */
export const asyncActionReducer = (
  state: AsyncActionState = {},
  action: AsyncAction<*, *>,
): AsyncActionState => {
  if (!action.meta) {
    return state;
  }

  switch (action.meta.status) {
    case 'ASYNC_PENDING':
      return {
        ...state,
        [action.type]: {
          ...state[action.type],
          [action.meta.identifier || '']: {
            completed: !!state[action.type]?.[action.meta.identifier || '']
              ?.completed,
            pending: true,
          },
        },
      };
    case 'ASYNC_COMPLETE':
      return {
        ...state,
        [action.type]: {
          ...state[action.type],
          [action.meta.identifier || '']: {
            completed: true,
            ...(action.meta.cache
              ? {
                  __do_not_use__response_cache: {
                    value: action.payload,
                    secondsSinceEpoch: Math.floor(Date.now() / 1000),
                  },
                }
              : {}),
          },
        },
      };
    case 'ASYNC_FAILED':
      return {
        ...state,
        [action.type]: {
          ...state[action.type],
          [action.meta.identifier || '']: {
            pending: false,
            error: {
              name:
                action.error && action.error.name
                  ? action.error.name
                  : 'UNKNOWN',
              message:
                action.error && action.error.message
                  ? action.error.message
                  : 'UNKNOWN',
              stack: action.error ? action.error.stack : undefined,
            },
          },
        },
      };
    case 'ASYNC_RESET':
      return {
        ...state,
        [action.type]: {
          ...state[action.type],
          [action.meta.identifier || '']: undefined,
        },
      };
    default:
      return state;
  }
};
