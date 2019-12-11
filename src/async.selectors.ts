
import { createSelector } from 'reselect';
import type {
  AllPendingSelector,
  IsPendingSelector,
  ErrorSelector,
} from './async.types';

const selectAllAsyncRequests = state => state.asyncActions || {};

/**
 * Creates a selector that returns a set of identifiers for the given action that
 * are pending.
 */
export const makeAllPendingSelector = (
  actionType: string,
): AllPendingSelector =>
  createSelector(
    selectAllAsyncRequests,
    allAsyncRequests =>
      Object.keys(allAsyncRequests[actionType] || {}).filter(
        k =>
          !!allAsyncRequests[actionType][k] &&
          !!allAsyncRequests[actionType][k].pending,
      ),
  );

/**
 * Creates a selector that returns true if the given action is pending.
 * The optional identifier argument allows you to match a specific instance
 * of an action created with an identifier. Omitting it returns true if
 * any actions of that type are pending.
 */
export const makeIsPendingSelector = (
  actionType: string,
  identifier?: string,
  initialValue?: boolean = false,
): IsPendingSelector =>
  createSelector(
    selectAllAsyncRequests,
    allAsyncRequests => {
      if (!!allAsyncRequests && !allAsyncRequests[actionType]) {
        return initialValue;
      }
      return (
        !!allAsyncRequests &&
        !!allAsyncRequests[actionType] &&
        !!allAsyncRequests[actionType][identifier || ''] &&
        !!allAsyncRequests[actionType][identifier || ''].pending
      );
    },
  );

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
    allAsyncRequests =>
      !!allAsyncRequests &&
      !!allAsyncRequests[actionType] &&
      !!allAsyncRequests[actionType][identifier || '']
        ? allAsyncRequests[actionType][identifier || ''].error || null
        : null,
  );

/**
 * Internal use only
 */
export const makeCachedResponseSelector = (
  actionType: $Subtype<string>,
  identifier?: string,
  ttlSeconds?: number,
) =>
  createSelector(
    selectAllAsyncRequests,
    allAsyncRequests => {
      const cacheRecord =
        !!allAsyncRequests &&
        !!allAsyncRequests[actionType] &&
        !!allAsyncRequests[actionType][identifier || '']
          ? allAsyncRequests[actionType][identifier || '']
              .__do_not_use__response_cache
          : null;

      if (!cacheRecord) {
        return null;
      }

      if (
        undefined !== ttlSeconds &&
        cacheRecord.secondsSinceEpoch + ttlSeconds < Date.now() / 1000
      ) {
        return null;
      }

      return cacheRecord.value;
    },
  );
