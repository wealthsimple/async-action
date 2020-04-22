// @flow
import {
  createAsyncAction,
  isPending,
  isComplete,
  isFailed,
  isBeingReset,
} from './async.action';

describe('Async Action Creators', () => {
  it('notifies when the action completes successfully', async () => {
    const mockDispatch = jest.fn();
    const mockGetState = () => ({});
    const mockPayload = 'a payload';

    const actionThunk = createAsyncAction(
      { type: 'SOME_ACTION' },
      () => Promise.resolve(mockPayload),
      { identifier: 'anIdentifier' },
    );
    const payload = await actionThunk(mockDispatch, mockGetState);

    expect(payload).toEqual(mockPayload);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      meta: { status: 'ASYNC_PENDING', identifier: 'anIdentifier' },
      error: null,
      payload: null,
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      payload: 'a payload',
      meta: { status: 'ASYNC_COMPLETE', identifier: 'anIdentifier' },
      error: null,
    });
  });

  it('notifies when the action fails', async () => {
    const mockDispatch = jest.fn();
    const mockGetState = () => ({});

    try {
      const actionThunk = createAsyncAction(
        { type: 'SOME_ACTION' },
        () => Promise.reject(new Error('BOOM')),
        { identifier: 'anIdentifier' },
      );
      await actionThunk(mockDispatch, mockGetState);
    } catch (err) {
      expect(err).toEqual(new Error('BOOM'));
    }

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      meta: { status: 'ASYNC_PENDING', identifier: 'anIdentifier' },
      payload: null,
      error: null,
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      error: new Error('BOOM'),
      meta: { status: 'ASYNC_FAILED', identifier: 'anIdentifier' },
      payload: null,
    });
  });

  it('de-dupes already pending actions', async () => {
    const mockDispatch = jest.fn();
    const mockGetState = () => ({
      asyncActions: {
        SOME_ACTION: {
          anIdentifier: {
            pending: true,
          },
        },
      },
    });

    const actionThunk = createAsyncAction(
      { type: 'SOME_ACTION' },
      () => Promise.resolve('a payload'),
      { identifier: 'anIdentifier' },
    );
    await actionThunk(mockDispatch, mockGetState);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      meta: { status: 'ASYNC_DEDUPED', identifier: 'anIdentifier' },
      payload: null,
      error: null,
    });
  });

  it("doesn't swallow errors that happen while notifying", async () => {
    const mockDispatch = jest
      .fn()
      // First call: pretend that set to pending succeeds.
      .mockImplementationOnce(_a => _a)
      // Second call: pretend dispatching the success case explodes in a reducer somewhere.
      .mockImplementationOnce(_a => {
        throw new Error('DISPATCH BOOM');
      });
    const mockGetState = () => ({});

    const actionThunk = createAsyncAction(
      { type: 'SOME_ACTION' },
      () => Promise.resolve('foo'),
      { identifier: 'anIdentifier' },
    );

    try {
      await actionThunk(mockDispatch, mockGetState);
    } catch (err) {
      expect(err).toEqual(new Error('DISPATCH BOOM'));
    }
  });

  it('can tell when an async action is pending', () => {
    expect(
      isPending({ type: 'FOO_ACTION', meta: { status: 'ASYNC_PENDING' } }),
    ).toBe(true);

    expect(
      isPending({ type: 'FOO_ACTION', meta: { status: 'ASYNC_COMPLETE' } }),
    ).toBe(false);

    expect(
      isPending({ type: 'FOO_ACTION', meta: { status: 'ASYNC_FAILED' } }),
    ).toBe(false);

    expect(
      isPending({ type: 'FOO_ACTION', meta: { status: 'ASYNC_CACHED' } }),
    ).toBe(false);

    expect(
      isPending({ type: 'FOO_ACTION', meta: { status: 'ASYNC_RESET' } }),
    ).toBe(false);
  });

  it('can tell when an async action completed successfully', () => {
    expect(
      isComplete({ type: 'FOO_ACTION', meta: { status: 'ASYNC_PENDING' } }),
    ).toBe(false);

    expect(
      isComplete({ type: 'FOO_ACTION', meta: { status: 'ASYNC_COMPLETE' } }),
    ).toBe(true);

    expect(
      isComplete({ type: 'FOO_ACTION', meta: { status: 'ASYNC_FAILED' } }),
    ).toBe(false);

    expect(
      isComplete({ type: 'FOO_ACTION', meta: { status: 'ASYNC_CACHED' } }),
    ).toBe(true);

    expect(
      isComplete({ type: 'FOO_ACTION', meta: { status: 'ASYNC_RESET' } }),
    ).toBe(false);
  });

  it('can tell when an async action has failed', () => {
    expect(
      isFailed({ type: 'FOO_ACTION', meta: { status: 'ASYNC_PENDING' } }),
    ).toBe(false);

    expect(
      isFailed({ type: 'FOO_ACTION', meta: { status: 'ASYNC_COMPLETE' } }),
    ).toBe(false);

    expect(
      isFailed({ type: 'FOO_ACTION', meta: { status: 'ASYNC_FAILED' } }),
    ).toBe(true);

    expect(
      isFailed({ type: 'FOO_ACTION', meta: { status: 'ASYNC_CACHED' } }),
    ).toBe(false);

    expect(
      isFailed({ type: 'FOO_ACTION', meta: { status: 'ASYNC_RESET' } }),
    ).toBe(false);
  });

  it('can tell when an async action is being reset', () => {
    expect(
      isBeingReset({ type: 'FOO_ACTION', meta: { status: 'ASYNC_PENDING' } }),
    ).toBe(false);

    expect(
      isBeingReset({ type: 'FOO_ACTION', meta: { status: 'ASYNC_COMPLETE' } }),
    ).toBe(false);

    expect(
      isBeingReset({ type: 'FOO_ACTION', meta: { status: 'ASYNC_FAILED' } }),
    ).toBe(false);

    expect(
      isBeingReset({ type: 'FOO_ACTION', meta: { status: 'ASYNC_CACHED' } }),
    ).toBe(false);

    expect(
      isBeingReset({ type: 'FOO_ACTION', meta: { status: 'ASYNC_RESET' } }),
    ).toBe(true);
  });

  it('caches responses if asked to', async () => {
    const mockPayload = 'a payload';
    const mockDispatch = jest.fn();
    const mockGetState = () => ({
      asyncActions: {
        SOME_ACTION: {
          anIdentifier: {
            __do_not_use__response_cache: {
              value: mockPayload,
            },
          },
        },
      },
    });

    const mockOperation = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockPayload));
    const actionThunk = createAsyncAction(
      { type: 'SOME_ACTION' },
      mockOperation,
      { identifier: 'anIdentifier', cache: true },
    );
    const payload = await actionThunk(mockDispatch, mockGetState);

    expect(payload).toEqual(mockPayload);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      meta: { status: 'ASYNC_CACHED', identifier: 'anIdentifier' },
      payload: mockPayload,
      error: null,
    });

    expect(mockOperation).not.toHaveBeenCalled();
  });

  it('respects a cache TTL if one is set', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1522620263000);

    const mockPayload = 'a payload';
    const mockDispatch = jest.fn();
    const mockGetState = () => ({
      asyncActions: {
        SOME_ACTION: {
          anIdentifier: {
            __do_not_use__response_cache: {
              value: mockPayload,
              secondsSinceEpoch: 1522620260, // 3 seconds ago.
            },
          },
        },
      },
    });

    const mockOperation = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockPayload));
    const actionThunk = createAsyncAction(
      { type: 'SOME_ACTION' },
      mockOperation,
      { identifier: 'anIdentifier', cache: true, ttlSeconds: 2 },
    );
    const payload = await actionThunk(mockDispatch, mockGetState);

    expect(payload).toEqual(mockPayload);
    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      meta: { status: 'ASYNC_PENDING', identifier: 'anIdentifier' },
      payload: null,
      error: null,
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      meta: {
        status: 'ASYNC_COMPLETE',
        identifier: 'anIdentifier',
        cache: true,
      },
      payload: mockPayload,
      error: null,
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('can correctly forward extraArguments', async () => {
    const mockDispatch = jest.fn();
    const mockGetState = () => ({});
    const mockExtraArguments = 'extraArguments';
    const mockOperation = jest.fn(() => Promise.resolve('a payload'));

    const actionThunk = createAsyncAction(
      { type: 'SOME_ACTION' },
      mockOperation,
      { identifier: 'anIdentifier' },
    );

    await actionThunk(mockDispatch, mockGetState, mockExtraArguments);

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockOperation).toHaveBeenCalledWith(
      mockDispatch,
      mockGetState,
      mockExtraArguments,
    );
  });
});
