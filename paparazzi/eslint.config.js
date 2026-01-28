import js from '@eslint/js';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default [
  // Ignore dist and public JS
  { ignores: ['**/dist/**', 'public/slides/**'] }
  // Base JS config
  , js.configs.recommended
  // TypeScript config
  , ...tseslint.configs.recommended
  // Svelte config
  , ...svelte.configs['flat/recommended']
  // Global settings for all files
  , {
    languageOptions: {
      globals: {
        ...globals.browser
        , ...globals.node
      }
    }
    , plugins: {
      '@stylistic': stylistic
    }
    , rules: {
      '@stylistic/comma-style': ['error', 'first']
      , 'comma-dangle': ['error', 'never']
      , '@stylistic/comma-spacing': ['error', { before: false, after: true }]
    }
  }
  // Svelte-specific settings
  , {
    files: ['**/*.svelte']
    , languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  }
  // .svelte.ts files (Svelte 5 runes)
  , {
    files: ['**/*.svelte.ts']
    , languageOptions: {
      parser: tseslint.parser
    }
  }
  // Allow any and unused vars in test files
  , {
    files: ['**/*.test.ts', '**/*.spec.ts']
    , rules: {
      '@typescript-eslint/no-explicit-any': 'off'
      , '@typescript-eslint/no-unused-vars': 'off'
    }
  }
  , {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error'
        , { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
      , 'svelte/require-each-key': 'off'
      , 'svelte/no-at-html-tags': 'off'
      , 'no-empty': ['error', { allowEmptyCatch: true }]
    }
  }
];
