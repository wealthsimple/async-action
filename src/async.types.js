// @flow
import type { Dispatch } from 'redux';

export type SimpleAction = { type: $Subtype<string> }

export type AsyncAction<Action: SimpleAction, PayloadType> = Action & {
  payload?: ?PayloadType,
  error?: ?Error,
  meta: {
    status: 'ASYNC_COMPLETE' | 'ASYNC_PENDING' | 'ASYNC_FAILED' | 'ASYNC_DEDUPED',
    identifier?: string,
  },
}

export type AsyncThunk = (
  dispatch: Dispatch<*>,
  getState: Function,
) => Promise<*>;

export type AsyncActionOptions = {
  identifier?: string;
};

export type ErrorInfo = {
  name: string;
  message: string;
  stack?: string;
}

export type AsyncActionRecord = {
  pending: boolean;
  error?: ErrorInfo;
}

export type AsyncActionState = {
  [actionType: string]: AsyncActionRecord;
}

export type AllPendingSelector = (state: any) => string[];
export type IsPendingSelector = (state: any) => boolean;
export type ErrorSelector = (state: any) => ?ErrorInfo;
