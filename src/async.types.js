export type AsyncAction = {
  type: string,
  payload?: any,
  error?: Error,
  meta: {
    status: 'ASYNC_COMPLETE' | 'ASYNC_PENDING' | 'ASYNC_FAILED',
    identifier?: string,
  },
}

export type AsyncOperation<R> = (...args: any) => Promise<R>;

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

export type IsPendingSelector = (state: any) => boolean;
export type ErrorSelector = (state: any) => ?ErrorInfo;
