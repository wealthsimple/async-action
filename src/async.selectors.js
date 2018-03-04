import { createSelector } from 'reselect';
import _ from 'lodash';
import type { IsPendingSelector, ErrorSelector } from './async.types';

const selectAllAsyncRequests = (state: any) => state.asyncActions;

export const makeIsPendingSelector = (
  actionType: string,
  identifier?: string,
): IsPendingSelector =>
  createSelector(
    selectAllAsyncRequests,
    allAsyncRequests => _.get(
      allAsyncRequests,
      `${actionType}(${identifier || ''}).pending`) ||
      false);

export const makeErrorSelector = (
  actionType: string,
  identifier?: string,
): ErrorSelector =>
  createSelector(
    selectAllAsyncRequests,
    allAsyncRequests => _.get(
      allAsyncRequests,
      `${actionType}(${identifier || ''}).error`) ||
      null);
