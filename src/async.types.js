export type AsyncAction = {
  type: string,
  payload?: any,
  error?: Error,
  meta: {
    status: string,
    identifier?: string,
  },
}

export type AsyncOperation<R> = (...args: any) => Promise<R>;
