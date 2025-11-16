# TS-Plato: Code Complexity & Maintainability Analysis

This directory contains tools for analyzing code complexity and maintainability across all packages and apps in the monorepo using [ts-plato](https://github.com/the-simian/ts-plato).

## Quick Start

To generate complexity reports for all packages and apps:

```bash
# From the repository root - using npm/pnpm commands
pnpm plato          # Generate reports AND display summary
pnpm plato:run      # Generate reports only
pnpm plato:info     # Display summary only

# Or run directly with PowerShell
.\metrics\ts-plato\run-all.ps1

# To view a summary of all packages
node .\metrics\ts-plato\summary.cjs
```

Reports will be generated in `coverage/ts-plato-*/` directories.

### Available Commands

The root `package.json` provides these convenient commands:

- **`pnpm plato`**: Complete workflow - generates all reports then displays summary
- **`pnpm plato:run`**: Generates HTML reports for all packages (equivalent to `run-all.ps1`)
- **`pnpm plato:info`**: Displays CLI summary table (equivalent to `summary.cjs`)

Note: `pnpm plato` is also integrated into `pnpm verify` for complete quality checks.

## Example Output

### Summary Report
```
TS-PLATO SUMMARY: Code Complexity & Maintainability Report
=================================================================

Package                  Files  SLOC     Avg CC   Maint    Δ CC     Δ Maint
---------------------------------------------------------------------------
anatomy-z-anatomy-dev    7      371.0    42.3     64.6     -        -
mesh-cli                 41     70.0     7.9      66.0     -        0.6
domain                   68     68.0     2.2      75.9     -        -
state                    38     31.0     3.6      77.1     -        -
utils                    5      11.0     1.4      97.8     -        -

Overall Summary (weighted by file count):
  Total Files      : 465
  Avg SLOC         : 66.2
  Avg Complexity   : 5.7
  Avg Maintainability: 75.6

Quality Assessment:
  Complexity: GOOD (≤10) - Simple, easy to test
  Maintainability: GOOD (65-84) - Moderately maintainable
```

The report highlights packages that need attention (low maintainability scores) and tracks improvements over time.

## What You Get

Each package/app gets its own detailed HTML report with:

- **Complexity Metrics**: Cyclomatic complexity, Halstead metrics, maintainability index
- **File-by-File Analysis**: Detailed breakdown of each source file
- **Visual Charts**: Complexity trends and hotspot identification
- **History Tracking**: Automatic preservation of historical data for trend analysis

## Understanding the Reports

### Main Report Files

- **`index.html`**: Overview dashboard with charts and summaries
- **`display.html`**: Detailed file-by-file analysis
- **`report.json`**: Machine-readable metrics data
- **`report.history.json`**: Historical trend data (preserved across runs)

### Key Metrics

- **Cyclomatic Complexity**: Number of independent paths through code (lower is better)
  - 1-10: Simple, easy to test
  - 11-20: Moderate complexity
  - 21+: High complexity, consider refactoring

- **Maintainability Index**: Overall maintainability score (higher is better)
  - 85-100: Highly maintainable
  - 65-84: Moderately maintainable  
  - 0-64: Difficult to maintain

- **Halstead Metrics**: Code vocabulary and difficulty measures
  - Volume: Amount of information in the code
  - Difficulty: How hard the code is to understand
  - Effort: Estimated time to understand/modify

## Interpreting Results

### Finding Complexity Hotspots

1. Open any `coverage/ts-plato-*/index.html` in your browser
2. Look for files with high cyclomatic complexity (red bars in charts)
3. Check maintainability index scores (lower scores need attention)
4. Use the file list to drill down into specific problem areas

### Using History Data

- History is automatically preserved in `report.history.json`
- Track complexity trends over time
- Identify when complexity spikes occur
- Measure impact of refactoring efforts

## Package Coverage

The analysis covers all packages and apps with `src/` directories:

**Packages:**
- anatomy, anatomy-z-anatomy, anatomy-z-anatomy-dev
- domain, guards, mesh-cli, mui-theme-viewer
- state, utils

**Apps:**
- supergains, supergains-devtools

## Command Options

```bash
# Standard run (preserves history)
pnpm plato:run
# Or directly:
.\metrics\ts-plato\run-all.ps1

# Skip history preservation (faster, useful for testing)
.\metrics\ts-plato\run-all.ps1 -SkipHistory

# Summary only (no report generation)
pnpm plato:info
# Or directly:
node .\metrics\ts-plato\summary.cjs
```

## Integration with Development Workflow

### When to Run Analysis

- **Before major refactoring**: Establish baseline metrics
- **After refactoring**: Measure improvement
- **Monthly reviews**: Track overall codebase health
- **Before releases**: Identify high-risk areas

### Quality Gates

Consider setting complexity thresholds:
- Max cyclomatic complexity: 15 per function
- Min maintainability index: 65 per file
- Monitor trends: complexity should not consistently increase

## Troubleshooting

### Parse Errors

Some modern TypeScript syntax may cause parse errors (visible in console output). This doesn't prevent report generation but may affect accuracy for those specific files.

**Common issues:**
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- Modern decorator syntax

These errors don't affect the overall analysis quality significantly.

### Missing Reports

If a package doesn't generate a report:
1. Verify the package has a `src/` directory
2. Check that TypeScript files exist in the `src/` directory
3. Look for error messages in the console output

## Related Tools

- **CLOC**: Line count analysis (`metrics/cloc/`)
- **Test Coverage**: Unit test coverage reports (`coverage/`)
- **Build Analysis**: Vite bundle analysis tools

## CI/CD Integration

### Preserving History in CI

To maintain historical trend data across CI builds:

**Option 1: Artifact Storage (Recommended)**
```yaml
# Azure Pipelines example
- task: PublishBuildArtifacts@1
  inputs:
    pathToPublish: 'coverage'
    artifactName: 'ts-plato-reports'
  condition: always()

# Download previous artifacts before running analysis
- task: DownloadBuildArtifacts@0
  inputs:
    artifactName: 'ts-plato-reports'
    downloadPath: '.'
  continueOnError: true
```

**Option 2: Git Storage**
```yaml
# Commit reports back to repository (be cautious of repo size)
- script: |
    git config user.email "ci@yourorg.com"
    git config user.name "CI Bot"
    git add coverage/ts-plato-*/report.history.json
    git commit -m "Update ts-plato history [skip ci]" || exit 0
    git push
```

**Option 3: External Storage**
```yaml
# Store in blob storage, database, etc.
- script: |
    # Upload coverage/ts-plato-*/report.history.json to external storage
    # Download previous history files before running analysis
```

### Performance Considerations

- **Parallel execution**: Consider running ts-plato per package in parallel for large monorepos
- **Incremental analysis**: Only analyze changed packages if build time is critical
- **Artifact expiration**: Clean up old coverage artifacts to manage storage costs

## Future Enhancements

- Summary dashboard aggregating all packages
- CLI-readable complexity summaries
- Integration with CI/CD pipelines
- Automated complexity trend alerts
