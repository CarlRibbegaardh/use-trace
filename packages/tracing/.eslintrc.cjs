/** @type {import("eslint").Linter.Config} */
/* c8 ignore start */
module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    project: "./tsconfig.eslint.json",
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  plugins: [
    "@typescript-eslint",
    "import",
    "react-hooks",
    "sort-exports"
  ],
  settings: {
    "import/resolver": {
      typescript: true,
      node: true
    }
  },
  rules: {
    "@typescript-eslint/no-non-null-assertion": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "args": "all",
        "argsIgnorePattern": "^_",
        "caughtErrors": "all",
        "caughtErrorsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }
    ],
    // "import/order": [
    //   "error",
    //   {
    //     "groups": ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"]
    //   }
    // ],
    "import/no-default-export": "warn",
    "sort-imports": [
      "error", {
        "ignoreCase": false,
        "ignoreDeclarationSort": true,
        "ignoreMemberSort": false,
        "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
        "allowSeparatedGroups": true
      }
    ],
    "arrow-body-style": ["warn", "always"], // The explicit function body makes test coverage possible for anonymous functions functions
    "prefer-template": ["warn"], // Changes string concatenation to template literals
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  },
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        // TS Only
        // -------

      }
    },
    {
      files: ["**/index.ts"],
      rules: {
        "sort-exports/sort-exports": ["error", { "ignoreCase": true, "sortDir": "asc" }]
      }
    },
    {
      files: ["**/*.config.*"],
      rules: {
        // Config files allowed to have default exports
        "import/no-default-export": "off"
      }
    }
  ]
};
