// @flow
import {
  makeIsPendingSelector,
  makeErrorSelector,
  makeAllPendingSelector,
  makeIsInitialRequestPendingSelector,
} from './async.selectors';

describe('AsyncSelectors', () => {
  let state: { [string]: any };
  let fakeError: Error;

  beforeEach(() => {
    fakeError = new Error('BOOM');
    state = {
      asyncActions: {
        FOO_ACTION: {
          fooId0: { pending: true, completed: false },
          fooId1: { pending: true, completed: true },
          fooId2: {
            pending: false,
            error: {
              name: 'Error',
              message: 'BOOM',
              stack: fakeError.stack,
            },
          },
        },
        FOO_ACTION_1: {
          '': { completed: true },
        },
        FOO_ACTION_2: undefined,
      },
    };
  });

  it('should let you select an ongoing action', () => {
    const fooId1PendingSelector = makeIsPendingSelector('FOO_ACTION', 'fooId1');
    const fooId2PendingSelector = makeIsPendingSelector('FOO_ACTION', 'fooId2');
    const fooId3PendingSelector = makeIsPendingSelector('FOO_ACTION', 'fooId3');
    const fooWrongActionPendingSelector = makeIsPendingSelector('FOO_ACTION_2');

    expect(fooId1PendingSelector(state)).toBe(true);
    expect(fooId2PendingSelector(state)).toBe(false);
    expect(fooId3PendingSelector(state)).toBe(false);
    expect(fooWrongActionPendingSelector(state)).toBe(false);
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

  it('should return the initial value for an action that has not been executed yet', () => {
    const fooActionId0PendingSelector = makeIsPendingSelector(
      'FOO_ACTION',
      'fooId0',
      true,
    );
    const fooActionId2PendingSelector = makeIsPendingSelector(
      'FOO_ACTION',
      'fooId2',
      true,
    );
    const fooAction1PendingSelector = makeIsPendingSelector(
      'FOO_ACTION_1',
      undefined,
      true,
    );
    const fooAction2PendingSelector = makeIsPendingSelector(
      'FOO_ACTION_2',
      undefined,
      true,
    );

    // if never ran before
    expect(fooAction2PendingSelector(state)).toBe(true);

    // if pending
    expect(fooActionId0PendingSelector(state)).toBe(true);

    // if empty but ran at least once
    expect(fooAction1PendingSelector(state)).toBe(false);

    // if error
    expect(fooActionId2PendingSelector(state)).toBe(false);
  });

  it('should let you select all ongoing identifiers for an action', () => {
    const fooActionAllPendingSelector = makeAllPendingSelector('FOO_ACTION');

    expect(fooActionAllPendingSelector(state)).toEqual(['fooId0', 'fooId1']);
  });

  describe('makeIsInitialRequestPendingSelector', () => {
    it('returns the initial value when the request is not yet in the store', () => {
      const unknownActionInitialPendingSelector = makeIsInitialRequestPendingSelector(
        'UNKNOWN_ACTION',
        undefined,
        true,
      );

      expect(unknownActionInitialPendingSelector(state)).toEqual(true);
    });

    it('returns false if the result is completed', () => {
      const fooAction1InitialPendingSelector = makeIsInitialRequestPendingSelector(
        'FOO_ACTION_1',
        undefined,
        true,
      );

      expect(fooAction1InitialPendingSelector(state)).toBe(false);
    });

    it('returns true if the result is pending and never completed', () => {
      const fooActionInitialPendingSelector = makeIsInitialRequestPendingSelector(
        'FOO_ACTION',
        'fooId0',
      );

      expect(fooActionInitialPendingSelector(state)).toBe(true);
    });

    it('returns false if the result is pending and previously completed', () => {
      const fooActionInitialPendingSelector = makeIsInitialRequestPendingSelector(
        'FOO_ACTION',
        'fooId1',
        true,
      );

      expect(fooActionInitialPendingSelector(state)).toBe(false);
    });

    it('returns false if the result is not pending and never completed', () => {
      const fooAction2InitialPendingSelector = makeIsInitialRequestPendingSelector(
        'FOO_ACTION_2',
      );

      expect(fooAction2InitialPendingSelector(state)).toBe(false);
    });
  });
});
