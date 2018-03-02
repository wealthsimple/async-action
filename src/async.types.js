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
