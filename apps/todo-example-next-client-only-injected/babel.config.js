module.exports = {
  presets: ['next/babel'],
  overrides: [
    {
      test: (filename) => {
        if (!filename) return false;
        if (filename.includes('node_modules')) return false;
        if (filename.includes('.next')) return false;
        if (filename.includes('build')) return false;
        if (filename.includes('dist')) return false;
        if (filename.endsWith('.test.ts') || filename.endsWith('.test.tsx') || filename.endsWith('.spec.ts') || filename.endsWith('.spec.tsx')) return false;
        return filename.endsWith('.tsx') || filename.endsWith('.jsx');
      },
      plugins: [
        [
          'module:auto-tracer-plugin-babel',
          {
            mode: 'opt-out',
            include: ['src/**/*.tsx', 'src/**/*.jsx', 'pages/**/*.tsx', 'pages/**/*.jsx', 'components/**/*.tsx', 'components/**/*.jsx'],
            exclude: ['**/*.test.*', '**/*.spec.*', '**/node_modules/**', '**/.next/**', '**/build/**', '**/dist/**', '**/emotion-is-prop-valid/**', 'unknown.tsx'],
            serverComponents: false,
            labelHooks: ['useState', 'useReducer'],
            importSource: 'auto-tracer'
          }
        ]
      ]
    }
  ]
};
