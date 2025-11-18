import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * User entity interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  active: boolean;
  joinDate: string;
}

/**
 * Users slice state interface
 */
export interface UsersState {
  users: User[];
  selectedUserId: string | null;
  filter: string;
  sortBy: keyof User;
  sortDirection: 'asc' | 'desc';
}

/**
 * Generate large dataset of users for performance testing
 */
const generateUsers = (count: number): User[] => {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'];
  const roles = ['Manager', 'Developer', 'Designer', 'Analyst', 'Specialist', 'Director'];

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    role: roles[i % roles.length]!,
    department: departments[i % departments.length]!,
    active: i % 3 !== 0,
    joinDate: new Date(2020 + (i % 4), i % 12, (i % 28) + 1).toISOString()
  }));
};

const initialState: UsersState = {
  users: generateUsers(5000),
  selectedUserId: null,
  filter: '',
  sortBy: 'name',
  sortDirection: 'asc'
};

/**
 * Users slice for managing user data
 */
export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    selectUser: (state, action: PayloadAction<string | null>) => {
      state.selectedUserId = action.payload;
    },
    setFilter: (state, action: PayloadAction<string>) => {
      state.filter = action.payload;
    },
    setSortBy: (state, action: PayloadAction<keyof User>) => {
      if (state.sortBy === action.payload) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortBy = action.payload;
        state.sortDirection = 'asc';
      }
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    toggleUserActive: (state, action: PayloadAction<string>) => {
      const user = state.users.find(u => u.id === action.payload);
      if (user) {
        user.active = !user.active;
      }
    }
  }
});

export const { selectUser, setFilter, setSortBy, updateUser, toggleUserActive } = usersSlice.actions;
export const usersReducer = usersSlice.reducer;
