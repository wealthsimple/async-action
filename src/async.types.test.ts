
import {
  type DispatchAPI,
  type Store,
  createStore,
  applyMiddleware,
} from 'redux';
import reduxThunk from 'redux-thunk';
import {
  type AsyncAction,
  type AsyncThunk,
  type AAction,
  type GetState,
  createAsyncAction,
} from '.';

/**
 * Typedef tests
 *
 * These tests don't do much at runtime. They are there to make sure that flow passes at
 * build time for a variety on scenarios.
 */
describe('AsyncAction typedef tests', () => {
  type FooAction = { type: 'FOO' };
  let simpleAction: FooAction;
  let store: Store<{}, AsyncThunk<*>, DispatchAPI<AsyncThunk<*>>>;

  beforeEach(() => {
    simpleAction = { type: 'FOO', param: 42 };
    store = createStore((state = {}) => state, applyMiddleware(reduxThunk));
  });

  describe('With no extra type specifications', () => {
    it('can create an AsyncAction', () => {
      const operation = () => Promise.resolve({ message: 'OHAI' });
      store.dispatch(createAsyncAction(simpleAction, operation));
    });

    it('can create an AsyncAction with a semi-complex operation', () => {
      const operation = _dispatch => Promise.resolve({ message: 'OHAI' });
      store.dispatch(createAsyncAction(simpleAction, operation));
    });

    it('can create an AsyncAction with a complex operation', () => {
      const operation = (_dispatch, _getState) =>
        Promise.resolve({ message: 'OHAI' });
      store.dispatch(createAsyncAction(simpleAction, operation));
    });
  });

  describe('With full type specifications', () => {
    type Payload = { message: string };

    describe('Using AsyncAction', () => {
      type FooAsyncAction = AsyncAction<FooAction, Payload>;

      it('can type and create an AsyncAction', () => {
        const operation = () => Promise.resolve({ message: 'OHAI' });
        const thunk = createAsyncAction<FooAsyncAction>(
          simpleAction,
          operation,
        );

        store.dispatch(thunk);
      });

      it('can type and create an AsyncAction with a semi-complex operation', () => {
        const operation = _dispatch => Promise.resolve({ message: 'OHAI' });
        const thunk = createAsyncAction<FooAsyncAction>(
          simpleAction,
          operation,
        );

        store.dispatch(thunk);
      });

      it('can type and create an AsyncAction with a complex operation', () => {
        const operation = (_dispatch, _getState) =>
          Promise.resolve({ message: 'OHAI' });
        const thunk = createAsyncAction<FooAsyncAction>(
          simpleAction,
          operation,
        );

        store.dispatch(thunk);
      });
    });

    describe('Using AAction', () => {
      type FooAAction = AAction<'FOO', Payload>;

      it('can type and create an AsyncAction', () => {
        const operation = () => Promise.resolve({ message: 'OHAI' });
        const thunk = createAsyncAction<FooAAction>(simpleAction, operation);
        store.dispatch(thunk);
      });

      it('can type and create an AsyncAction with a semi-complex operation', () => {
        const operation = (_dispatch: DispatchAPI<*>) =>
          Promise.resolve({ message: 'OHAI' });
        const thunk = createAsyncAction<FooAAction>(simpleAction, operation);
        store.dispatch(thunk);
      });

      it('can type and create an AsyncAction with a complex operation', () => {
        const operation = (_dispatch: DispatchAPI<*>, _getState: GetState<*>) =>
          Promise.resolve({ message: 'OHAI' });
        const thunk = createAsyncAction<FooAAction>(simpleAction, operation);
        store.dispatch(thunk);
      });
    });
  });
});
