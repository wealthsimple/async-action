import { createSelector } from 'reselect';
import get from 'lodash.get';
import pickBy from 'lodash.pickby';
import type {
  AllPendingSelector,
  IsPendingSelector,
  ErrorSelector,
} from './async.types';

const selectAllAsyncRequests = (state: any) => state.asyncActions;

/**
 * Creates a selector that returns a set of identifiers for the given action that
 * are pending.
 */
export const makeAllPendingSelector = (actionType: string): AllPendingSelector =>
  createSelector(
    selectAllAsyncRequests,
    allAsyncRequests =>
      Object.keys(pickBy(allAsyncRequests[actionType], r => !!r.pending)));

/**
 * Creates a selector that returns true if the given action is pending.
 * The optional identifier argument allows you to match a specific instance
 * of an action created with an identifier. Omitting it returns true if
 * any actions of that type are pending.
 */
export const makeIsPendingSelector = (
  actionType: string,
  identifier?: string,
): IsPendingSelector =>
  createSelector(
    selectAllAsyncRequests,
    allAsyncRequests =>
      !!get(allAsyncRequests, `${actionType}.${identifier || ''}.pending`));

/**
 * Creates a selector that returns any error for the given actionType and optional
 * identifier. Omitting the identifier looks for an error associated with the action
 * type alone and returns null if it is not found.
 */
export const makeErrorSelector = (
  actionType: string,
  identifier?: string,
): ErrorSelector =>
  createSelector(
    selectAllAsyncRequests,
    allAsyncRequests => get(
      allAsyncRequests,
      `${actionType}.${identifier || ''}.error`) ||
      null);
