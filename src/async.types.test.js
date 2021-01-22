// @flow
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
  let store: Store<
    { [string]: any },
    AsyncThunk<*>,
    DispatchAPI<AsyncThunk<*>>,
  >;

  beforeEach(() => {
    simpleAction = ({ type: 'FOO', param: 42 }: FooAction);
    store = createStore((state = {}) => state, applyMiddleware(reduxThunk));
  });

  describe('With no extra type specifications', () => {
    it('can create an AsyncAction', () => {
      const operation = () => Promise.resolve({ message: 'OHAI' });
      store.dispatch(createAsyncAction(simpleAction, operation));
    });

    it('can create an AsyncAction with a semi-complex operation', () => {
      const operation = () => Promise.resolve({ message: 'OHAI' });
      store.dispatch(createAsyncAction(simpleAction, operation));
    });

    it('can create an AsyncAction with a complex operation', () => {
      const operation = () => Promise.resolve({ message: 'OHAI' });
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
        const operation = () => Promise.resolve({ message: 'OHAI' });
        const thunk = createAsyncAction<FooAsyncAction>(
          simpleAction,
          operation,
        );

        store.dispatch(thunk);
      });

      it('can type and create an AsyncAction with a complex operation', () => {
        const operation = () => Promise.resolve({ message: 'OHAI' });
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
        const operation = () => Promise.resolve({ message: 'OHAI' });
        const thunk = createAsyncAction<FooAAction>(simpleAction, operation);
        store.dispatch(thunk);
      });

      it('can type and create an AsyncAction with a complex operation', () => {
        const operation = () => Promise.resolve({ message: 'OHAI' });
        const thunk = createAsyncAction<FooAAction>(simpleAction, operation);
        store.dispatch(thunk);
      });
    });

    describe('thunk withExtraArgument supplying the extra argument', () => {
      type ExtraArgument = 'ExtraArgument';
      type FooAsyncAction = AAction<'FOO', ExtraArgument>;

      it('can enforce the type between the operation and the thunk caller', () => {
        const operation = (
          _dispatch,
          _getState,
          extraArguments?: ExtraArgument,
        ) => Promise.resolve(extraArguments);

        const thunk = createAsyncAction<FooAsyncAction>(
          simpleAction,
          operation,
        );

        store.dispatch(thunk);
      });
    });
  });
});
