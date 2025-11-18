import { Box, Paper, TextField, Button, Typography, Grid, Chip, Select, MenuItem, FormControl, InputLabel, type SelectChangeEvent } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setFilter, setSortBy, toggleUserActive } from '../store/usersSlice';
import { selectSortedFilteredUsers, selectActiveUsersCount, selectUsersByDepartment } from '../store/selectors/userSelectors';
import type { User } from '../store/usersSlice';

/**
 * User card component displaying individual user information
 */
function UserCard({ user }: { user: User }) {
  const dispatch = useDispatch();

  const handleToggleActive = () => {
    dispatch(toggleUserActive(user.id));
  };

  return (
    <Paper sx={{ p: 2, mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">{user.name}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          <Box sx={{ mt: 1 }}>
            <Chip label={user.department} size="small" sx={{ mr: 1 }} />
            <Chip label={user.role} size="small" color="primary" sx={{ mr: 1 }} />
            <Chip
              label={user.active ? 'Active' : 'Inactive'}
              size="small"
              color={user.active ? 'success' : 'default'}
            />
          </Box>
        </Box>
        <Button onClick={handleToggleActive} variant="outlined" size="small">
          Toggle Status
        </Button>
      </Box>
    </Paper>
  );
}

/**
 * Department summary component
 */
function DepartmentSummary() {
  const usersByDept = useSelector(selectUsersByDepartment);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Department Summary</Typography>
      <Grid container spacing={2}>
        {Object.entries(usersByDept).map(([dept, users]) => (
          <Grid item xs={12} sm={6} md={4} key={dept}>
            <Box sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2">{dept}</Typography>
              <Typography variant="h5">{users.length}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

/**
 * User list filters component
 */
function UserFilters() {
  const dispatch = useDispatch();
  const filter = useSelector((state: any) => state.users.filter);
  const sortBy = useSelector((state: any) => state.users.sortBy);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setFilter(e.target.value));
  };

  const handleSortChange = (e: SelectChangeEvent) => {
    dispatch(setSortBy(e.target.value as keyof User));
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Search users"
            value={filter}
            onChange={handleFilterChange}
            placeholder="Search by name, email, department, or role"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} label="Sort By" onChange={handleSortChange}>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="department">Department</MenuItem>
              <MenuItem value="role">Role</MenuItem>
              <MenuItem value="joinDate">Join Date</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
}

/**
 * User statistics component
 */
function UserStats() {
  const activeCount = useSelector(selectActiveUsersCount);
  const totalCount = useSelector((state: any) => state.users.users.length);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="h4">{totalCount}</Typography>
          <Typography variant="body2" color="text.secondary">Total Users</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="h4">{activeCount}</Typography>
          <Typography variant="body2" color="text.secondary">Active Users</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}

/**
 * User list component displaying filtered and sorted users
 */
function UserList() {
  const users = useSelector(selectSortedFilteredUsers);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Users ({users.length})
      </Typography>
      <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
        {users.slice(0, 100).map(user => (
          <UserCard key={user.id} user={user} />
        ))}
        {users.length > 100 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            Showing first 100 of {users.length} users
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/**
 * Users dashboard page component with typical SPA layout
 */
export function UsersDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Users Dashboard</Typography>
      <UserStats />
      <DepartmentSummary />
      <UserFilters />
      <UserList />
    </Box>
  );
}
