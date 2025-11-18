# MUI Performance Test App

## Purpose

This application is specifically designed to stress-test the `@auto-tracer/react18` library and identify performance bottlenecks in real-world scenarios. It simulates a complex Material-UI based single-page application with:

- Large Redux state (5,000 users, 10,000 products)
- Multiple pages with complex component hierarchies
- Frequent state updates and re-renders
- Deep component nesting (up to 5 levels)
- Various rendering patterns (memo, context, selectors)

## Architecture

### Redux Store

The app uses Redux Toolkit with two main slices:

1. **Users Slice** (`usersSlice.ts`)
   - 5,000 user records with filtering and sorting
   - Actions: selectUser, setFilter, setSortBy, updateUser, toggleUserActive

2. **Products Slice** (`productsSlice.ts`)
   - 10,000 product records with category and price filtering
   - Actions: selectProduct, setCategoryFilter, setPriceRange, updateProductStock

### Selectors

Both vanilla and memoized selectors are used to test performance:

- **Vanilla selectors**: Direct state access
- **Memoized selectors** (`createSelector`): Expensive computations with caching

Examples:
- `selectSortedFilteredUsers`: Filters and sorts 5,000 users
- `selectFilteredProducts`: Filters 10,000 products by category and price
- `selectUsersByDepartment`: Groups users by department

### Pages

#### 1. Users Dashboard (`/`)

A typical SPA dashboard with:

```
UsersDashboard
├── UserStats (total/active counts)
├── DepartmentSummary (grid of department cards)
├── UserFilters (search + sort controls)
└── UserList
    └── UserCard[] (100 visible items)
```

**Component Characteristics:**
- Multiple MUI components (Paper, Grid, TextField, Select, Chip, Button)
- Redux selectors at different levels
- Frequent updates when filtering/sorting
- List virtualization (shows first 100 of filtered results)

**Performance Triggers:**
- Typing in search field (re-filters 5,000 users)
- Changing sort order (re-sorts entire dataset)
- Toggling user status (updates Redux + re-renders affected components)

#### 2. Stress Test (`/stress`)

A deliberate stress test page with:

```
StressTest
├── ControlPanel (depth slider, update triggers)
├── StatsPanel (expensive calculations)
├── UpdateContext.Provider
│   └── DeepNest1
│       └── DeepNest2
│           └── DeepNest3
│               └── DeepNest4
│                   └── DeepNest5
│                       └── Content
└── ProductGrid
    └── ProductItem[] × 50 (with sliders)
```

**Component Characteristics:**
- Configurable nesting depth (1-5 levels)
- Context propagation through all levels
- 50 product items with interactive sliders
- Toggle between memo/non-memo components
- Toggle between useMemo/raw calculations

**Performance Triggers:**
- Context updates (forces re-render of all nested components)
- Slider interactions (50 simultaneous stock updates)
- Stats recalculation (reduce operations on 10,000 items)
- Toggling memo/useMemo (tests optimization effectiveness)

## Expected Performance Issues

### 1. Large State Re-Renders

When AutoTracer hooks into every component, large state updates cause:
- Trace data generation for 100+ components simultaneously
- Memory allocation for trace objects
- Potential garbage collection pressure

### 2. Selector Re-Evaluation

With AutoTracer tracking state changes:
- Every selector call may be traced
- Memoization cache misses trigger expensive re-computations
- Trace data accumulates for selector hierarchies

### 3. Deep Component Trees

The stress test deliberately creates:
- 5-level deep nesting with context updates
- All children re-render on context change
- AutoTracer must track entire render cascade

### 4. High-Frequency Updates

Slider interactions and rapid filtering create:
- Multiple renders per second
- Trace buffer growth
- Potential memory leaks if trace data isn't cleaned up

## Running the App

### Install Dependencies

```bash
pnpm install
```

### Development Mode

```bash
pnpm --filter @auto-tracer/perf-test-mui dev
```

### Build

```bash
pnpm --filter @auto-tracer/perf-test-mui build
```

## Performance Testing Scenarios

### Scenario 1: Initial Load

1. Start the dev server
2. Open browser DevTools (Performance tab)
3. Navigate to http://localhost:5173
4. **Expected**: Measure initial render time with AutoTracer enabled

### Scenario 2: User Search

1. Navigate to Users Dashboard
2. Type in the search field
3. **Expected**: Watch for lag/freezing during typing
4. **Metrics**: Render time per keystroke, memory usage

### Scenario 3: Stress Test - Context Updates

1. Navigate to Stress Test page
2. Set nesting depth to 5
3. Click "Trigger Context Update" rapidly
4. **Expected**: Potential freeze or 2+ second hangs
5. **Metrics**: Update latency, memory growth

### Scenario 4: Stress Test - Slider Interactions

1. Stay on Stress Test page
2. Move multiple product sliders simultaneously
3. **Expected**: Choppy interactions, delayed responses
4. **Metrics**: Frame rate, input latency

### Scenario 5: Memo Comparison

1. On Stress Test page
2. Toggle "Memo OFF" → interact with sliders → measure lag
3. Toggle "Memo ON" → interact with sliders → measure lag
4. **Expected**: Identify if AutoTracer interferes with memo optimization

## Debugging Hooks

The app includes AutoTracer initialization in `main.tsx`:

```typescript
initAutoTracer({
  enabled: true,
  logLevel: 'info'
});
```

Modify configuration to test different scenarios:
- Disable tracing: `enabled: false`
- Reduce logging: `logLevel: 'error'`
- Custom buffer sizes (if supported)

## Known Performance Bottlenecks

Based on the implementation, suspected bottlenecks include:

1. **Trace Data Accumulation**
   - Traces for 5,000 users × multiple renders
   - No visible cleanup/pruning mechanism

2. **Hook Injection Overhead**
   - Every component gets `useAutoTracer` injected
   - Even memoized components re-trace

3. **Selector Tracking**
   - Redux selectors called hundreds of times
   - Each call may generate trace data

4. **Context Propagation**
   - Deep trees with context force all children to re-render
   - AutoTracer must track entire cascade

## Next Steps

1. **Profile with React DevTools Profiler**
   - Identify which components cause the most re-renders
   - Measure impact of AutoTracer on render time

2. **Memory Profiling**
   - Take heap snapshots before/after interactions
   - Identify memory leaks in trace storage

3. **Comparative Benchmarks**
   - Run app with AutoTracer disabled
   - Measure performance delta

4. **Trace Buffer Analysis**
   - Log trace buffer size over time
   - Determine cleanup strategy

## Technology Stack

- **React 18.2** - Component library
- **Material-UI 5.14** - UI components
- **Redux Toolkit 2.0** - State management
- **React Router 6.20** - Routing
- **Vite 5.0** - Build tool
- **TypeScript 5.3** - Type safety
- **AutoTracer** - Performance monitoring (under test)

## Component Metrics

| Component | Children | Redux Selectors | State Updates | Memo Used |
|-----------|----------|-----------------|---------------|-----------|
| UsersDashboard | 5 | 4 | Medium | No |
| UserList | 100 | 1 | Low | No |
| UserCard | 0 | 0 | Medium | No |
| StressTest | 4 | 2 | High | Optional |
| DeepNest1-5 | 1 each | 0 | High | No |
| ProductItem | 0 | 1 | High | Optional |
| ProductGrid | 50 | 1 | Low | No |

## File Structure

```
src/
├── main.tsx              # Entry point with AutoTracer init
├── App.tsx               # Router and theme setup
├── store/
│   ├── store.ts          # Redux store configuration
│   ├── usersSlice.ts     # Users state slice (5,000 records)
│   ├── productsSlice.ts  # Products state slice (10,000 records)
│   └── selectors/
│       ├── userSelectors.ts    # Vanilla + memoized selectors
│       └── productSelectors.ts # Vanilla + memoized selectors
└── pages/
    ├── UsersDashboard.tsx # Complex SPA dashboard
    └── StressTest.tsx     # Deep nesting stress test
```

## License

MIT (internal testing tool)
