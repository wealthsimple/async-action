// @flow
import type { Dispatch } from 'redux';

export type SimpleAction = { type: $Subtype<string> };

export type AsyncAction<Action: SimpleAction, PayloadType> = Action & {
  payload?: ?PayloadType,
  error?: ?Error,
  meta: {
    status:
      | 'ASYNC_COMPLETE'
      | 'ASYNC_PENDING'
      | 'ASYNC_FAILED'
      | 'ASYNC_DEDUPED'
      | 'ASYNC_CACHED',
    identifier?: string,
  },
};

export type GetState<State> = () => State;

export type AsyncThunk = (
  dispatch: Dispatch<*>,
  getState: GetState<*>,
) => Promise<*>;

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
  [actionType: string]: AsyncActionRecord,
};

export type AllPendingSelector = (state: *) => string[];
export type IsPendingSelector = (state: *) => boolean;
export type ErrorSelector = (state: *) => ?ErrorInfo;
