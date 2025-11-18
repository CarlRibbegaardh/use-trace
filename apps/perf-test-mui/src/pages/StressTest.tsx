import { memo, useState, useCallback, createContext, useContext, useMemo } from 'react';
import { Box, Paper, Typography, Button, Slider } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { updateProductStock } from '../store/productsSlice';
import { selectFilteredProducts } from '../store/selectors/productSelectors';

/**
 * Context for propagating updates through deep component tree
 */
const UpdateContext = createContext<{ updateCount: number }>({ updateCount: 0 });

/**
 * Deeply nested component at level 1
 */
function DeepNest1({ depth, children }: { depth: number; children?: React.ReactNode }) {
  const { updateCount } = useContext(UpdateContext);
  return (
    <Box sx={{ pl: 2, borderLeft: '2px solid #ccc', mt: 1 }}>
      <Typography variant="caption">Level 1 (Updates: {updateCount})</Typography>
      {depth > 1 ? <DeepNest2 depth={depth - 1}>{children}</DeepNest2> : children}
    </Box>
  );
}

/**
 * Deeply nested component at level 2
 */
function DeepNest2({ depth, children }: { depth: number; children?: React.ReactNode }) {
  const { updateCount } = useContext(UpdateContext);
  return (
    <Box sx={{ pl: 2, borderLeft: '2px solid #bbb', mt: 1 }}>
      <Typography variant="caption">Level 2 (Updates: {updateCount})</Typography>
      {depth > 1 ? <DeepNest3 depth={depth - 1}>{children}</DeepNest3> : children}
    </Box>
  );
}

/**
 * Deeply nested component at level 3
 */
function DeepNest3({ depth, children }: { depth: number; children?: React.ReactNode }) {
  const { updateCount } = useContext(UpdateContext);
  return (
    <Box sx={{ pl: 2, borderLeft: '2px solid #aaa', mt: 1 }}>
      <Typography variant="caption">Level 3 (Updates: {updateCount})</Typography>
      {depth > 1 ? <DeepNest4 depth={depth - 1}>{children}</DeepNest4> : children}
    </Box>
  );
}

/**
 * Deeply nested component at level 4
 */
function DeepNest4({ depth, children }: { depth: number; children?: React.ReactNode }) {
  const { updateCount } = useContext(UpdateContext);
  return (
    <Box sx={{ pl: 2, borderLeft: '2px solid #999', mt: 1 }}>
      <Typography variant="caption">Level 4 (Updates: {updateCount})</Typography>
      {depth > 1 ? <DeepNest5 depth={depth - 1}>{children}</DeepNest5> : children}
    </Box>
  );
}

/**
 * Deeply nested component at level 5
 */
function DeepNest5({ children }: { depth: number; children?: React.ReactNode }) {
  const { updateCount } = useContext(UpdateContext);
  return (
    <Box sx={{ pl: 2, borderLeft: '2px solid #888', mt: 1 }}>
      <Typography variant="caption">Level 5 (Updates: {updateCount})</Typography>
      {children}
    </Box>
  );
}

/**
 * Product item component (frequently re-rendering)
 */
function ProductItem({ productId }: { productId: string }) {
  const dispatch = useDispatch();
  const product = useSelector((state: any) =>
    state.products.products.find((p: any) => p.id === productId)
  );

  const handleStockChange = useCallback((_: Event, value: number | number[]) => {
    if (typeof value === 'number') {
      dispatch(updateProductStock({ id: productId, stock: value }));
    }
  }, [dispatch, productId]);

  if (!product) return null;

  return (
    <Paper sx={{ p: 1, mb: 1 }}>
      <Typography variant="body2">{product.name}</Typography>
      <Typography variant="caption" color="text.secondary">
        ${product.price} - {product.category}
      </Typography>
      <Slider
        value={product.stock}
        onChange={handleStockChange}
        min={0}
        max={500}
        size="small"
      />
    </Paper>
  );
}

/**
 * Memoized product item to test memo effectiveness
 */
const MemoizedProductItem = memo(ProductItem);

/**
 * Product grid component with many items
 */
function ProductGrid({ useMemo: useMemoization }: { useMemo: boolean }) {
  const products = useSelector(selectFilteredProducts);
  const displayProducts = products.slice(0, 50);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1 }}>
      {displayProducts.map(product =>
        useMemoization
          ? <MemoizedProductItem key={product.id} productId={product.id} />
          : <ProductItem key={product.id} productId={product.id} />
      )}
    </Box>
  );
}

/**
 * Statistics panel that recalculates on every render
 */
function StatsPanel({ useOptimization }: { useOptimization: boolean }) {
  const products = useSelector(selectFilteredProducts);

  const stats = useOptimization
    ? useMemo(() => ({
        total: products.length,
        avgPrice: products.reduce((sum, p) => sum + p.price, 0) / (products.length || 1),
        totalStock: products.reduce((sum, p) => sum + p.stock, 0)
      }), [products])
    : {
        total: products.length,
        avgPrice: products.reduce((sum, p) => sum + p.price, 0) / (products.length || 1),
        totalStock: products.reduce((sum, p) => sum + p.stock, 0)
      };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">Product Statistics</Typography>
      <Typography>Total: {stats.total}</Typography>
      <Typography>Avg Price: ${stats.avgPrice.toFixed(2)}</Typography>
      <Typography>Total Stock: {stats.totalStock}</Typography>
    </Paper>
  );
}

/**
 * Control panel for stress test configuration
 */
function ControlPanel({
  nestingDepth,
  onDepthChange,
  updateCount,
  onTriggerUpdate,
  useMemoization,
  onToggleMemoization,
  useOptimization,
  onToggleOptimization
}: {
  nestingDepth: number;
  onDepthChange: (depth: number) => void;
  updateCount: number;
  onTriggerUpdate: () => void;
  useMemoization: boolean;
  onToggleMemoization: () => void;
  useOptimization: boolean;
  onToggleOptimization: () => void;
}) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>Stress Test Controls</Typography>
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Nesting Depth: {nestingDepth}</Typography>
        <Slider
          value={nestingDepth}
          onChange={(_, value) => onDepthChange(value as number)}
          min={1}
          max={5}
          marks
          step={1}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={onTriggerUpdate}>
          Trigger Context Update ({updateCount})
        </Button>
        <Button
          variant={useMemoization ? 'contained' : 'outlined'}
          onClick={onToggleMemoization}
        >
          {useMemoization ? 'Memo ON' : 'Memo OFF'}
        </Button>
        <Button
          variant={useOptimization ? 'contained' : 'outlined'}
          onClick={onToggleOptimization}
        >
          {useOptimization ? 'useMemo ON' : 'useMemo OFF'}
        </Button>
      </Box>
    </Paper>
  );
}

/**
 * Stress test page with deep nesting and performance challenges
 */
export function StressTest() {
  const [nestingDepth, setNestingDepth] = useState(3);
  const [updateCount, setUpdateCount] = useState(0);
  const [useMemoization, setUseMemoization] = useState(false);
  const [useOptimization, setUseOptimization] = useState(false);

  const handleTriggerUpdate = useCallback(() => {
    setUpdateCount(c => c + 1);
  }, []);

  const contextValue = useMemo(() => ({ updateCount }), [updateCount]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Performance Stress Test</Typography>

      <ControlPanel
        nestingDepth={nestingDepth}
        onDepthChange={setNestingDepth}
        updateCount={updateCount}
        onTriggerUpdate={handleTriggerUpdate}
        useMemoization={useMemoization}
        onToggleMemoization={() => setUseMemoization(m => !m)}
        useOptimization={useOptimization}
        onToggleOptimization={() => setUseOptimization(o => !o)}
      />

      <StatsPanel useOptimization={useOptimization} />

      <UpdateContext.Provider value={contextValue}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Deep Component Nesting</Typography>
          <DeepNest1 depth={nestingDepth}>
            <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
              <Typography>Bottom of nesting (depth: {nestingDepth})</Typography>
            </Paper>
          </DeepNest1>
        </Paper>
      </UpdateContext.Provider>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Product Grid (50 items)</Typography>
        <ProductGrid useMemo={useMemoization} />
      </Paper>
    </Box>
  );
}
