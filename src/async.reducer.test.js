// @flow
import { asyncActionReducer } from './async.reducer';
import { resetAsyncAction } from './async.action';

describe('AsyncAction reducer', () => {
  describe('a pending request', () => {
    it('should record a pending request', () => {
      const state = {};
      const pendingAction = {
        type: 'GET_FOOS_BY_NAME',
        meta: {
          status: 'ASYNC_PENDING',
          identifier: 'nameOfTheFoo',
        },
      };

      const newState = asyncActionReducer(state, pendingAction);

      expect(newState).toEqual({
        GET_FOOS_BY_NAME: {
          nameOfTheFoo: {
            completed: false,
            pending: true,
          },
        },
      });

      // Also check that the request is marked as completed
      const completeAction = {
        type: 'GET_FOOS_BY_NAME',
        meta: {
          status: 'ASYNC_COMPLETE',
          identifier: 'nameOfTheFoo',
        },
      };

      const finalState = asyncActionReducer(newState, completeAction);

      expect(finalState).toEqual({
        GET_FOOS_BY_NAME: {
          nameOfTheFoo: { completed: true },
        },
      });
    });

    it('should persist whether the action has completed previously', () => {
      const state = {
        GET_FOOS_BY_NAME: {
          nameOfTheFoo: { completed: true },
        },
      };

      const pendingAction = {
        type: 'GET_FOOS_BY_NAME',
        meta: {
          status: 'ASYNC_PENDING',
          identifier: 'nameOfTheFoo',
        },
      };

      const newState = asyncActionReducer(state, pendingAction);

      expect(newState).toEqual({
        GET_FOOS_BY_NAME: {
          nameOfTheFoo: {
            completed: true,
            pending: true,
          },
        },
      });
    });
  });

  it('should cache a payload if asked to', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1522620261999);
    const state = {};
    const completedAction = {
      type: 'GET_FOOS_BY_NAME',
      payload: 'a payload',
      meta: {
        status: 'ASYNC_COMPLETE',
        identifier: 'nameOfTheFoo',
        cache: true,
      },
    };

    const newState = asyncActionReducer(state, completedAction);

    expect(newState).toEqual({
      GET_FOOS_BY_NAME: {
        nameOfTheFoo: {
          completed: true,
          __do_not_use__response_cache: {
            value: 'a payload',
            secondsSinceEpoch: 1522620261,
          },
        },
      },
    });
  });

  it('should record a failed request', () => {
    const state = {};
    const action = {
      type: 'GET_FOOS_BY_NAME',
      error: new Error('BOOM'),
      meta: {
        status: 'ASYNC_FAILED',
        identifier: 'nameOfTheFoo',
      },
    };

    const newState = asyncActionReducer(state, action);

    expect(newState).toEqual({
      GET_FOOS_BY_NAME: {
        nameOfTheFoo: {
          pending: false,
          error: {
            name: 'Error',
            message: 'BOOM',
            stack: action.error.stack,
          },
        },
      },
    });
  });

  it('gracefully handles a malformed error', () => {
    const state = {};
    const action = {
      type: 'GET_FOOS_BY_NAME',
      error: 'a am a string not an error silly!',
      meta: {
        status: 'ASYNC_FAILED',
        identifier: 'nameOfTheFoo',
      },
    };

    const newState = asyncActionReducer(state, action);

    expect(newState).toEqual({
      GET_FOOS_BY_NAME: {
        nameOfTheFoo: {
          pending: false,
          error: {
            name: 'UNKNOWN',
            message: 'UNKNOWN',
          },
        },
      },
    });
  });

  it('resets a record if asked to', () => {
    const initialState = {
      GET_FOOS_BY_NAME: {
        nameOfTheFoo: {
          pending: false,
          error: {
            name: 'Error',
            message: 'BOOM',
          },
        },
      },
      GET_BARS_BY_NAME: {
        nameOfTheBar: {
          pending: false,
          error: {
            name: 'Error2',
            message: 'BOOM2',
          },
        },
      },
    };

    const action = resetAsyncAction('GET_FOOS_BY_NAME', 'nameOfTheFoo');

    const newState = asyncActionReducer(initialState, action);

    expect(newState).toEqual({
      GET_FOOS_BY_NAME: {},
      GET_BARS_BY_NAME: {
        nameOfTheBar: {
          pending: false,
          error: {
            name: 'Error2',
            message: 'BOOM2',
          },
        },
      },
    });
  });
});
