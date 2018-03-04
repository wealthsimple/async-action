import { createAsyncAction, isPending, isComplete, isFailed } from './async.action';

describe('Async Action Creators', () => {
  it('notifies when the action completes successfully', async () => {
    const mockDispatch = jest.fn();
    const mockGetState = () => ({});

    const actionThunk = createAsyncAction(
      'SOME_ACTION',
      () => Promise.resolve('a payload'),
      'anIdentifier');
    await actionThunk(mockDispatch, mockGetState);

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      meta: { status: 'ASYNC_PENDING', identifier: 'anIdentifier' },
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      payload: 'a payload',
      meta: { status: 'ASYNC_COMPLETE', identifier: 'anIdentifier' },
    });
  });

  it('notifies when the action fails', async () => {
    const mockDispatch = jest.fn();
    const mockGetState = () => ({});

    try {
      const actionThunk = createAsyncAction(
        'SOME_ACTION',
        () => Promise.reject(new Error('BOOM')),
        'anIdentifier');
      await actionThunk(mockDispatch, mockGetState);
    } catch (err) {
      expect(err).toEqual(new Error('BOOM'));
    }

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      meta: { status: 'ASYNC_PENDING', identifier: 'anIdentifier' },
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      error: new Error('BOOM'),
      meta: { status: 'ASYNC_FAILED', identifier: 'anIdentifier' },
    });
  });

  it('de-dupes already pending actions', async () => {
    const mockDispatch = jest.fn();
    const mockGetState = () => ({
      asyncActions: {
        'SOME_ACTION(anIdentifier)': {
          pending: true,
        },
      },
    });

    const actionThunk = createAsyncAction(
      'SOME_ACTION',
      () => Promise.resolve('foo'),
      'anIdentifier');
    await actionThunk(mockDispatch, mockGetState);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SOME_ACTION',
      meta: { status: 'ASYNC_DEDUPED', identifier: 'anIdentifier' },
    });
  });

  it('doesn\'t swallow errors that happen while notifying', async () => {
    const mockDispatch = jest.fn()
      // First call: pretend that set to pending succeeds.
      .mockImplementationOnce(_a => _a)
      // Second call: pretend dispatching the success case explodes in a reducer somewhere.
      .mockImplementationOnce(((_a) => { throw new Error('DISPATCH BOOM'); }));
    const mockGetState = () => ({});

    const actionThunk = createAsyncAction(
      'SOME_ACTION',
      () => Promise.resolve('foo'),
      'anIdentifier');

    try {
      await actionThunk(mockDispatch, mockGetState);
    } catch (err) {
      expect(err).toEqual(new Error('DISPATCH BOOM'));
    }
  });

  it('can tell when an async action is pending', () => {
    expect(
      isPending({ type: 'FOO_ACTION', meta: { status: 'ASYNC_PENDING' } }))
      .toBe(true);

    expect(
      isPending({ type: 'FOO_ACTION', meta: { status: 'ASYNC_COMPLETE' } }))
      .toBe(false);

    expect(
      isPending({ type: 'FOO_ACTION', meta: { status: 'ASYNC_FAILED' } }))
      .toBe(false);
  });


  it('can tell when an async action completed successfully', () => {
    expect(
      isComplete({ type: 'FOO_ACTION', meta: { status: 'ASYNC_PENDING' } }))
      .toBe(false);

    expect(
      isComplete({ type: 'FOO_ACTION', meta: { status: 'ASYNC_COMPLETE' } }))
      .toBe(true);

    expect(
      isComplete({ type: 'FOO_ACTION', meta: { status: 'ASYNC_FAILED' } }))
      .toBe(false);
  });

  it('can tell when an async action has failed', () => {
    expect(
      isFailed({ type: 'FOO_ACTION', meta: { status: 'ASYNC_PENDING' } }))
      .toBe(false);

    expect(
      isFailed({ type: 'FOO_ACTION', meta: { status: 'ASYNC_COMPLETE' } }))
      .toBe(false);

    expect(
      isFailed({ type: 'FOO_ACTION', meta: { status: 'ASYNC_FAILED' } }))
      .toBe(true);
  });
});
