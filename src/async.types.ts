
import type { DispatchAPI } from 'redux';

export type SimpleAction = { type: $Subtype<string> };

// Intentionally recursive type.
// eslint-disable-next-line no-use-before-define
type JSONLiteral = JSONObject | JSONArray | string | number;
type JSONObject = {
  [string]: JSONLiteral,
};
type JSONArray = JSONLiteral[];

// Deprecated. Use the AAction shorthand below.
export type AsyncAction<Action: SimpleAction, PayloadType> = Action & {
  payload?: ?PayloadType,
  error?: ?(JSONLiteral | Error),
  meta: {
    status:
      | 'ASYNC_COMPLETE'
      | 'ASYNC_PENDING'
      | 'ASYNC_FAILED'
      | 'ASYNC_DEDUPED'
      | 'ASYNC_CACHED'
      | 'ASYNC_RESET',

    identifier?: string,
  },
};

// Shorthand form of AsyncAction:
export type AAction<ActionType: string, PayloadType, ActionFields = {}> = {
  type: ActionType,
} & ActionFields & {
    payload?: ?PayloadType,
    error?: ?(JSONLiteral | Error),
    meta: {
      status:
        | 'ASYNC_COMPLETE'
        | 'ASYNC_PENDING'
        | 'ASYNC_FAILED'
        | 'ASYNC_DEDUPED'
        | 'ASYNC_CACHED'
        | 'ASYNC_RESET',
      identifier?: string,
    },
  };

export type GetState<State> = () => State;

export type AsyncThunk<Payload> = (
  dispatch: DispatchAPI<*>,
  getState: GetState<*>,
) => Promise<Payload>;

export type AsyncActionOptions = {
  identifier?: string,
  cache?: boolean,
  overwriteCache?: boolean,
  ttlSeconds?: number,
};

export type ErrorInfo = {
  name: string,
  message: string,
  stack?: string,
};

export type AsyncActionRecord = {
  pending: boolean,
  error?: ErrorInfo,
  __do_not_use__response_cache?: {
    value: mixed,
    secondsSinceEpoch: number,
  },
};

export type AsyncActionState = {
  [actionType: string]: {
    [identifier: string]: AsyncActionRecord,
  },
};

export type AllPendingSelector = (state: *) => string[];
export type IsPendingSelector = (state: *) => boolean;
export type ErrorSelector = (state: *) => ?ErrorInfo;
