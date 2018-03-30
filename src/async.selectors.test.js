// @flow
import {
  makeIsPendingSelector,
  makeErrorSelector,
  makeAllPendingSelector,
} from './async.selectors';

describe('AsyncSelectors', () => {
  let state;
  let fakeError;

  beforeEach(() => {
    fakeError = new Error('BOOM');
    state = {
      asyncActions: {
        FOO_ACTION: {
          fooId0: { pending: true },
          fooId1: { pending: true },
          fooId2: {
            pending: false,
            error: {
              name: 'Error',
              message: 'BOOM',
              stack: fakeError.stack,
            },
          },
        },
      },
    };
  });

  it('should let you select an ongoing action', () => {
    const fooId1PendingSelector = makeIsPendingSelector('FOO_ACTION', 'fooId1');
    const fooId2PendingSelector = makeIsPendingSelector('FOO_ACTION', 'fooId2');
    const fooId3PendingSelector = makeIsPendingSelector('FOO_ACTION', 'fooId3');

    expect(fooId1PendingSelector(state)).toBe(true);
    expect(fooId2PendingSelector(state)).toBe(false);
    expect(fooId3PendingSelector(state)).toBe(false);
  });

  it('should let you select an error', () => {
    const fooId1ErrorSelector = makeErrorSelector('FOO_ACTION', 'fooId1');
    const fooId2ErrorSelector = makeErrorSelector('FOO_ACTION', 'fooId2');
    const fooId3ErrorSelector = makeErrorSelector('FOO_ACTION', 'fooId3');

    expect(fooId1ErrorSelector(state)).toBe(null);
    expect(fooId2ErrorSelector(state)).toEqual({
      name: 'Error',
      message: 'BOOM',
      stack: fakeError.stack,
    });

    expect(fooId3ErrorSelector(state)).toBe(null);
  });

  it('should let you select all ongoing identifiers for an action', () => {
    const fooActionAllPendingSelector = makeAllPendingSelector('FOO_ACTION');

    expect(fooActionAllPendingSelector(state)).toEqual(['fooId0', 'fooId1']);
  });
});
