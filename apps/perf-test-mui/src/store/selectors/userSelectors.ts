import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { User } from '../usersSlice';

/**
 * Vanilla selector to get all users
 */
export const selectAllUsers = (state: RootState): User[] => state.users.users;

/**
 * Vanilla selector to get filter text
 */
export const selectUserFilter = (state: RootState): string => state.users.filter;

/**
 * Vanilla selector to get sort configuration
 */
export const selectUserSort = (state: RootState): { sortBy: keyof User; sortDirection: 'asc' | 'desc' } => ({
  sortBy: state.users.sortBy,
  sortDirection: state.users.sortDirection
});

/**
 * Vanilla selector to get selected user ID
 */
export const selectSelectedUserId = (state: RootState): string | null => state.users.selectedUserId;

/**
 * Memoized selector to get filtered users
 */
export const selectFilteredUsers = createSelector(
  [selectAllUsers, selectUserFilter],
  (users, filter) => {
    if (!filter) return users;
    const lowerFilter = filter.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(lowerFilter) ||
      user.email.toLowerCase().includes(lowerFilter) ||
      user.department.toLowerCase().includes(lowerFilter) ||
      user.role.toLowerCase().includes(lowerFilter)
    );
  }
);

/**
 * Memoized selector to get sorted and filtered users
 */
export const selectSortedFilteredUsers = createSelector(
  [selectFilteredUsers, selectUserSort],
  (users, { sortBy, sortDirection }) => {
    const sorted = [...users].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return sortDirection === 'asc'
          ? (aVal === bVal ? 0 : aVal ? 1 : -1)
          : (aVal === bVal ? 0 : bVal ? 1 : -1);
      }

      return 0;
    });

    return sorted;
  }
);

/**
 * Memoized selector to get selected user
 */
export const selectSelectedUser = createSelector(
  [selectAllUsers, selectSelectedUserId],
  (users, selectedId) => {
    if (!selectedId) return null;
    return users.find(u => u.id === selectedId) ?? null;
  }
);

/**
 * Memoized selector to get active users count
 */
export const selectActiveUsersCount = createSelector(
  [selectAllUsers],
  (users) => users.filter(u => u.active).length
);

/**
 * Memoized selector to get users by department
 */
export const selectUsersByDepartment = createSelector(
  [selectAllUsers],
  (users) => {
    const byDept: Record<string, User[]> = {};
    users.forEach(user => {
      if (!byDept[user.department]) {
        byDept[user.department] = [];
      }
      byDept[user.department]!.push(user);
    });
    return byDept;
  }
);
